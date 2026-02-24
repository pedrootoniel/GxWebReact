const { getPool, getWebDb } = require('../config/database');

async function getMarketItemCount(server, filters = {}) {
  const pool = await getPool(getWebDb());
  const req = pool.request().input('server', server);
  let where = `active_till > GETDATE() AND add_date <= DATEADD(minute, -1, GETDATE()) AND active = 1 AND sold != 1 AND removed != 1 AND server = @server`;

  if (filters.category !== undefined && filters.category !== '') {
    req.input('cat', filters.category);
    where += ` AND cat = @cat`;
  }
  if (filters.search) {
    req.input('search', `%${filters.search}%`);
    where += ` AND item_name LIKE @search`;
  }

  const result = await req.query(`SELECT COUNT(id) AS count FROM DmN_Market WHERE ${where}`);
  return result.recordset[0]?.count || 0;
}

async function getMarketItems(server, page = 1, perPage = 20, filters = {}) {
  const pool = await getPool(getWebDb());
  const offset = (page - 1) * perPage;
  const req = pool.request()
    .input('server', server)
    .input('perPage', perPage)
    .input('offset', offset);

  let where = `active_till > GETDATE() AND add_date <= DATEADD(minute, -1, GETDATE()) AND active = 1 AND sold != 1 AND removed != 1 AND server = @server`;

  if (filters.category !== undefined && filters.category !== '') {
    req.input('cat', filters.category);
    where += ` AND cat = @cat`;
  }
  if (filters.search) {
    req.input('search', `%${filters.search}%`);
    where += ` AND item_name LIKE @search`;
  }
  if (filters.minLevel) {
    req.input('minLvl', filters.minLevel);
    where += ` AND lvl >= @minLvl`;
  }
  if (filters.hasLuck) {
    where += ` AND has_luck = 1`;
  }
  if (filters.hasSkill) {
    where += ` AND has_skill = 1`;
  }
  if (filters.hasExcellent) {
    where += ` AND (has_exe_1 = 1 OR has_exe_2 = 1 OR has_exe_3 = 1 OR has_exe_4 = 1 OR has_exe_5 = 1 OR has_exe_6 = 1)`;
  }

  const result = await req.query(`
    SELECT id, cat, item, item_name, price_type, price, seller, add_date, active_till,
           highlighted, char, price_jewel, jewel_type, lvl, has_luck, has_skill, has_ancient,
           has_exe_1, has_exe_2, has_exe_3, has_exe_4, has_exe_5, has_exe_6
    FROM DmN_Market
    WHERE ${where}
    ORDER BY highlighted DESC, id DESC
    OFFSET @offset ROWS FETCH NEXT @perPage ROWS ONLY
  `);
  return result.recordset;
}

async function getMarketItemById(id, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('id', id)
    .input('server', server)
    .query(`
      SELECT TOP 1 id, item, item_name, price, price_type, seller, add_date, active_till, cat, char, server,
             price_jewel, jewel_type, item_password, lvl, has_luck, has_skill, has_ancient,
             has_exe_1, has_exe_2, has_exe_3, has_exe_4, has_exe_5, has_exe_6
      FROM DmN_Market
      WHERE id = @id AND add_date <= DATEADD(minute, -1, GETDATE()) AND active = 1 AND removed != 1 AND server = @server
    `);
  return result.recordset[0] || null;
}

async function markAsSold(id) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('id', id)
    .query(`UPDATE DmN_Market SET active = 0, sold = 1 WHERE id = @id`);
}

async function markAsRemoved(id) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('id', id)
    .query(`UPDATE DmN_Market SET active = 0, removed = 1 WHERE id = @id`);
}

async function logMarketPurchase(seller, buyer, price, priceType, addDate, activeTill, item, cat, char, server) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('seller', seller)
    .input('buyer', buyer)
    .input('price', price)
    .input('type', priceType)
    .input('add_date', addDate)
    .input('active_till', activeTill)
    .input('item', item)
    .input('cat', cat)
    .input('char', char)
    .input('server', server)
    .query(`
      INSERT INTO DmN_Market_Logs (seller, buyer, price, price_type, start_date, end_date, sold_date, item, cat, char, server)
      VALUES (@seller, @buyer, @price, @type, @add_date, @active_till, GETDATE(), @item, @cat, @char, @server)
    `);
}

async function getMyListings(account, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('seller', account)
    .input('server', server)
    .query(`
      SELECT id, cat, item, item_name, price_type, price, add_date, active_till, sold, removed, highlighted
      FROM DmN_Market
      WHERE seller = @seller AND server = @server
      ORDER BY id DESC
    `);
  return result.recordset;
}

async function getMarketSlots(account, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('user', account)
    .input('server', server)
    .query(`SELECT slots FROM DmN_Market_Slots WHERE memb___id = @user AND server = @server`);
  return result.recordset[0]?.slots || 0;
}

async function getPurchaseHistory(account, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('buyer', account)
    .input('server', server)
    .query(`
      SELECT seller, price, price_type, sold_date, item, cat, char, server
      FROM DmN_Market_Logs
      WHERE buyer = @buyer AND server = @server
      ORDER BY sold_date DESC
    `);
  return result.recordset;
}

module.exports = {
  getMarketItemCount,
  getMarketItems,
  getMarketItemById,
  markAsSold,
  markAsRemoved,
  logMarketPurchase,
  getMyListings,
  getMarketSlots,
  getPurchaseHistory,
};

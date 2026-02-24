const { getPool, getWebDb, getGameDb } = require('../config/database');

async function getShopItems(server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .query(`
      SELECT id, item_id, item_cat, name, original_item_cat, stick_level, price, payment_type,
             max_item_lvl, max_item_opt, use_sockets, use_harmony, use_refinary, exetype, luck, total_bought
      FROM DmN_Shopp
      WHERE price >= 1
      ORDER BY item_cat ASC, item_id ASC
    `);
  return result.recordset;
}

async function getShopItemById(id) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('id', id)
    .query(`
      SELECT TOP 1 id, item_id, item_cat, exetype, name, luck, price, max_item_lvl, max_item_opt,
             use_sockets, use_harmony, use_refinary, payment_type, original_item_cat, total_bought, stick_level
      FROM DmN_Shopp
      WHERE id = @id AND price >= 1
    `);
  return result.recordset[0] || null;
}

async function getHarmonyOptions(itemType, harmonyOption) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('type', itemType)
    .input('hopt', harmonyOption)
    .query(`
      SELECT id, hvalue, hname, price
      FROM DmN_Shop_Harmony
      WHERE itemtype = @type AND hoption = @hopt AND status = 1
    `);
  return result.recordset;
}

async function getSocketOptions(exetype) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('exetype', exetype)
    .query(`
      SELECT seed, socket_id, socket_name, socket_price
      FROM DmN_Shop_Sockets
      WHERE status != 0 AND socket_part_type IN (-1, @exetype)
      ORDER BY orders ASC
    `);
  return result.recordset;
}

async function getWarehouse(accountId) {
  const pool = await getPool(getGameDb());
  const result = await pool.request()
    .input('user', accountId)
    .query(`SELECT CONVERT(VARBINARY(MAX), Items) AS Items, Money FROM Warehouse WHERE AccountId = @user`);
  return result.recordset[0] || null;
}

async function updateWarehouse(accountId, newItemsHex) {
  const pool = await getPool(getGameDb());
  await pool.request()
    .input('user', accountId)
    .query(`UPDATE Warehouse SET Items = ${newItemsHex} WHERE AccountId = @user`);
}

async function incrementItemSerial() {
  const pool = await getPool(getGameDb());
  const result = await pool.request()
    .query(`UPDATE GameServerInfo SET ItemCount = ItemCount + 1; SELECT ItemCount FROM GameServerInfo`);
  return result.recordset[0]?.ItemCount || 0;
}

async function logPurchase(username, server, itemHex, price, priceType, ip) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('user', username)
    .input('server', server)
    .input('hex', itemHex)
    .input('price', price)
    .input('price_type', priceType)
    .input('ip', ip)
    .query(`
      INSERT INTO DmN_Shop_Logs (memb___id, server, item_hex, date, price, price_type, ip)
      VALUES (@user, @server, @hex, GETDATE(), @price, @price_type, @ip)
    `);
}

async function updateTotalBought(itemId, originalCat) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('id', itemId)
    .input('cat', originalCat)
    .query(`UPDATE DmN_Shopp SET total_bought = total_bought + 1 WHERE item_id = @id AND original_item_cat = @cat`);
}

async function getCartItems(account, priceType, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('account', account)
    .input('type', priceType)
    .input('server', server)
    .query(`
      SELECT id, item_hex, price
      FROM DmN_Shop_Card
      WHERE account = @account AND price_type = @type AND server = @server AND bought = 0
    `);
  return result.recordset;
}

async function addToCart(account, itemHex, price, priceType, server) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('account', account)
    .input('item_hex', itemHex)
    .input('price', price)
    .input('price_type', priceType)
    .input('server', server)
    .query(`
      INSERT INTO DmN_Shop_Card (account, item_hex, price, price_type, server, time_added)
      VALUES (@account, @item_hex, @price, @price_type, @server, GETDATE())
    `);
}

async function removeFromCart(account, id, server) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('account', account)
    .input('id', id)
    .input('server', server)
    .query(`DELETE FROM DmN_Shop_Card WHERE account = @account AND id = @id AND server = @server AND bought = 0`);
}

async function getCredits(username, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('user', username)
    .query(`
      SELECT
        ISNULL((SELECT WCoinC FROM ${getGameDb()}..CashShopData WHERE AccountID = @user), 0) AS credits,
        ISNULL((SELECT GoblinPoint FROM ${getGameDb()}..CashShopData WHERE AccountID = @user), 0) AS credits2
    `);
  return result.recordset[0] || { credits: 0, credits2: 0 };
}

async function deductCredits(username, amount, creditType) {
  const pool = await getPool(getGameDb());
  if (creditType === 1) {
    await pool.request()
      .input('user', username)
      .input('amount', amount)
      .query(`UPDATE CashShopData SET WCoinC = WCoinC - @amount WHERE AccountID = @user AND WCoinC >= @amount`);
  } else if (creditType === 2) {
    await pool.request()
      .input('user', username)
      .input('amount', amount)
      .query(`UPDATE CashShopData SET GoblinPoint = GoblinPoint - @amount WHERE AccountID = @user AND GoblinPoint >= @amount`);
  }
}

module.exports = {
  getShopItems,
  getShopItemById,
  getHarmonyOptions,
  getSocketOptions,
  getWarehouse,
  updateWarehouse,
  incrementItemSerial,
  logPurchase,
  updateTotalBought,
  getCartItems,
  addToCart,
  removeFromCart,
  getCredits,
  deductCredits,
};

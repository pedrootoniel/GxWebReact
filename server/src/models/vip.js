const { getPool, getWebDb } = require('../config/database');

async function getVipPackages(server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('server', server)
    .query(`
      SELECT id, package_title, price, payment_type, vip_time, shop_discount,
             reset_price_decrease, reset_level_decrease, reset_bonus_points,
             grand_reset_bonus_credits, grand_reset_bonus_gcredits,
             wcoins, allow_extend, status
      FROM DmN_Vip_Packages
      WHERE server = @server AND status = 1
      ORDER BY price ASC
    `);
  return result.recordset;
}

async function getVipPackageById(id) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('id', id)
    .query(`
      SELECT id, package_title, price, payment_type, server, vip_time, shop_discount,
             reset_price_decrease, reset_level_decrease, reset_bonus_points,
             grand_reset_bonus_credits, grand_reset_bonus_gcredits,
             wcoins, allow_extend, status
      FROM DmN_Vip_Packages
      WHERE id = @id AND status = 1
    `);
  return result.recordset[0] || null;
}

async function getUserVip(account, server) {
  const pool = await getPool(getWebDb());
  const result = await pool.request()
    .input('account', account)
    .input('server', server)
    .query(`SELECT viptype, viptime FROM DmN_Vip_Users WHERE memb___id = @account AND server = @server`);
  return result.recordset[0] || null;
}

async function insertVip(account, server, vipType, vipTime) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('account', account)
    .input('server', server)
    .input('viptype', vipType)
    .input('viptime', vipTime)
    .query(`INSERT INTO DmN_Vip_Users (memb___id, server, viptype, viptime) VALUES (@account, @server, @viptype, @viptime)`);
}

async function updateVip(account, server, vipType, vipTime) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('account', account)
    .input('server', server)
    .input('viptype', vipType)
    .input('viptime', vipTime)
    .query(`UPDATE DmN_Vip_Users SET viptype = @viptype, viptime = @viptime WHERE memb___id = @account AND server = @server`);
}

async function removeVip(account, server) {
  const pool = await getPool(getWebDb());
  await pool.request()
    .input('account', account)
    .input('server', server)
    .query(`DELETE FROM DmN_Vip_Users WHERE memb___id = @account AND server = @server`);
}

module.exports = {
  getVipPackages,
  getVipPackageById,
  getUserVip,
  insertVip,
  updateVip,
  removeVip,
};

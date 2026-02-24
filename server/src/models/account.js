const { sql, getPool } = require('../config/database');

const AccountModel = {
  async findByUsername(username) {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query('SELECT memb___id, memb__pwd, mail_addr, bloc_code, ctl1_code FROM MEMB_INFO WHERE memb___id = @username');
    return result.recordset[0] || null;
  },

  async create(username, password, email) {
    const pool = await getPool();
    await pool.request()
      .input('username', sql.VarChar(10), username)
      .input('password', sql.VarChar(128), password)
      .input('email', sql.VarChar(50), email)
      .query(`
        INSERT INTO MEMB_INFO (memb___id, memb__pwd, memb_name, sno__numb, mail_addr, bloc_code, ctl1_code)
        VALUES (@username, @password, @username, '1111111111111', @email, 0, 0)
      `);
  },

  async updatePassword(username, newPassword) {
    const pool = await getPool();
    await pool.request()
      .input('username', sql.VarChar(10), username)
      .input('password', sql.VarChar(128), newPassword)
      .query('UPDATE MEMB_INFO SET memb__pwd = @password WHERE memb___id = @username');
  },

  async getAccountInfo(username) {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query(`
        SELECT
          mi.memb___id AS username,
          mi.mail_addr AS email,
          mi.bloc_code,
          mi.ctl1_code,
          ms.ConnectStat,
          ms.ServerName,
          ms.IP
        FROM MEMB_INFO mi
        LEFT JOIN MEMB_STAT ms ON mi.memb___id = ms.memb___id
        WHERE mi.memb___id = @username
      `);
    return result.recordset[0] || null;
  },

  async isOnline(username) {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @username');
    const row = result.recordset[0];
    return row ? row.ConnectStat === 1 : false;
  },

  async getOnlineCount() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT COUNT(*) AS total FROM MEMB_STAT WHERE ConnectStat = 1');
    return result.recordset[0].total;
  },
};

module.exports = AccountModel;

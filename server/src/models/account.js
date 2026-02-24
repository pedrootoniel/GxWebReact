const { sql, getPool, getAccountDb, getWebDb } = require('../config/database');

const MD5_MODE = parseInt(process.env.MD5_MODE || '0');

const AccountModel = {
  async findByUsername(username) {
    const pool = await getPool(getAccountDb());
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query(`
        SELECT memb_guid, memb___id, memb__pwd, memb_name, mail_addr, bloc_code, ctl1_code,
               appl_days, modi_days, last_login, last_login_ip, Admin, dmn_country, activated
        FROM MEMB_INFO WITH (NOLOCK)
        WHERE (memb___id Collate Database_Default = @username Collate Database_Default)
      `);
    return result.recordset[0] || null;
  },

  async checkDuplicateUsername(username) {
    const pool = await getPool(getAccountDb());
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query('SELECT memb___id FROM MEMB_INFO WHERE (memb___id Collate Database_Default = @username Collate Database_Default)');
    return result.recordset.length > 0;
  },

  async checkDuplicateEmail(email) {
    const pool = await getPool(getAccountDb());
    const result = await pool.request()
      .input('email', sql.VarChar(50), email)
      .query('SELECT memb___id FROM MEMB_INFO WHERE mail_addr = @email');
    return result.recordset.length > 0;
  },

  async create(username, password, email) {
    const pool = await getPool(getAccountDb());
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    await pool.request()
      .input('memb___id', sql.VarChar(10), username)
      .input('memb__pwd', sql.VarChar(128), password)
      .input('memb_name', sql.VarChar(10), username)
      .input('sno__numb', sql.VarChar(18), '1111111111111')
      .input('post_code', sql.VarChar(10), '1234')
      .input('addr_info', sql.VarChar(50), '11111')
      .input('addr_deta', sql.VarChar(50), '12343')
      .input('mail_addr', sql.VarChar(50), email || '')
      .input('phon_numb', sql.VarChar(15), '12345')
      .input('job__code', sql.VarChar(2), '1')
      .input('appl_days', sql.DateTime, now)
      .input('modi_days', sql.VarChar(10), dateStr)
      .input('out__days', sql.VarChar(10), dateStr)
      .input('true_days', sql.VarChar(10), dateStr)
      .input('bloc_code', sql.TinyInt, 0)
      .input('ctl1_code', sql.TinyInt, 0)
      .query(`
        INSERT INTO MEMB_INFO
          (memb___id, memb__pwd, memb_name, sno__numb, post_code, addr_info, addr_deta,
           mail_addr, phon_numb, job__code, appl_days, modi_days, out__days, true_days,
           bloc_code, ctl1_code)
        VALUES
          (@memb___id, @memb__pwd, @memb_name, @sno__numb, @post_code, @addr_info, @addr_deta,
           @mail_addr, @phon_numb, @job__code, @appl_days, @modi_days, @out__days, @true_days,
           @bloc_code, @ctl1_code)
      `);
  },

  async updatePassword(username, newPassword) {
    const pool = await getPool(getAccountDb());
    await pool.request()
      .input('username', sql.VarChar(10), username)
      .input('password', sql.VarChar(128), newPassword)
      .query('UPDATE MEMB_INFO SET memb__pwd = @password WHERE (memb___id Collate Database_Default = @username Collate Database_Default)');
  },

  async updateLastLogin(username, ip, country) {
    const pool = await getPool(getAccountDb());
    await pool.request()
      .input('username', sql.VarChar(10), username)
      .input('ip', sql.VarChar(15), ip || '0.0.0.0')
      .input('country', sql.VarChar(8), country || 'BR')
      .query('UPDATE MEMB_INFO SET last_login = GETDATE(), last_login_ip = @ip, dmn_country = @country WHERE memb___id = @username');
  },

  async getConnectionStatus(username) {
    const pool = await getPool(getAccountDb());
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query(`
        SELECT TOP 1 a.Id, a.GameIDC, m.ConnectStat, m.ConnectTM, m.DisConnectTM, m.IP, m.ServerName
        FROM AccountCharacter AS a
        RIGHT JOIN MEMB_STAT AS m ON (a.Id Collate Database_Default = m.memb___id)
        WHERE m.memb___id = @username
      `);
    return result.recordset[0] || null;
  },

  async isOnline(username) {
    const pool = await getPool(getAccountDb());
    const result = await pool.request()
      .input('username', sql.VarChar(10), username)
      .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @username');
    const row = result.recordset[0];
    return row ? row.ConnectStat === 1 : false;
  },

  async getOnlineCount() {
    const pool = await getPool(getAccountDb());
    const result = await pool.request()
      .query('SELECT COUNT(memb___id) AS count FROM MEMB_STAT WHERE ConnectStat = 1');
    return result.recordset[0].count;
  },

  async getCredits(username) {
    try {
      const pool = await getPool(getWebDb());
      const result = await pool.request()
        .input('username', sql.VarChar(10), username)
        .query('SELECT credits, credits2, credits3 FROM DmN_Shop_Credits WHERE memb___id = @username');
      return result.recordset[0] || { credits: 0, credits2: 0, credits3: 0 };
    } catch {
      return { credits: 0, credits2: 0, credits3: 0 };
    }
  },

  async getVipInfo(username) {
    try {
      const pool = await getPool(getWebDb());
      const result = await pool.request()
        .input('username', sql.VarChar(10), username)
        .query('SELECT viptype, viptime FROM DmN_Vip_Users WHERE memb___id = @username');
      return result.recordset[0] || null;
    } catch {
      return null;
    }
  },

  async getStats() {
    const pool = await getPool(getAccountDb());
    const gamePool = await getPool();
    const [totalAccounts, totalCharacters, totalGuilds, onlineCount] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS count FROM MEMB_INFO'),
      gamePool.request().query('SELECT COUNT(*) AS count FROM Character'),
      gamePool.request().query('SELECT COUNT(*) AS count FROM Guild'),
      pool.request().query('SELECT COUNT(memb___id) AS count FROM MEMB_STAT WHERE ConnectStat = 1'),
    ]);
    return {
      totalAccounts: totalAccounts.recordset[0].count,
      totalCharacters: totalCharacters.recordset[0].count,
      totalGuilds: totalGuilds.recordset[0].count,
      onlineCount: onlineCount.recordset[0].count,
    };
  },

  getMD5Mode() {
    return MD5_MODE;
  },
};

module.exports = AccountModel;

const { sql, getPool, getAccountDb } = require('../config/database');

const RESET_COL = process.env.RESET_COLUMN || 'Resets';
const GRESET_COL = process.env.GRESET_COLUMN || 'GrandResets';

const GuildModel = {
  async getRankings({ page = 1, limit = 20, search }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;
    const request = pool.request()
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    let where = '';
    if (search) {
      request.input('search', sql.VarChar(20), `%${search}%`);
      where = 'WHERE g.G_Name LIKE @search';
    }

    const result = await request.query(`
      SELECT g.G_Name, g.G_Master, g.G_Mark, g.G_Score,
             (SELECT COUNT(Name) FROM GuildMember WHERE G_Name = g.G_Name) AS MemberCount
      FROM Guild AS g
      ${where}
      ORDER BY g.G_Score DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const guilds = [];
    for (const row of result.recordset) {
      let masterLevel = 0;
      let masterResets = 0;
      try {
        const charRes = await pool.request()
          .input('master', sql.VarChar(10), row.G_Master?.trim())
          .query(`SELECT cLevel, ${RESET_COL} AS Resets FROM Character WHERE Name = @master`);
        if (charRes.recordset[0]) {
          masterLevel = charRes.recordset[0].cLevel;
          masterResets = charRes.recordset[0].Resets || 0;
        }
      } catch { /* empty */ }

      guilds.push({
        name: row.G_Name?.trim(),
        master: row.G_Master?.trim(),
        score: row.G_Score || 0,
        masterLevel,
        masterResets,
        memberCount: row.MemberCount || 0,
      });
    }

    return { guilds };
  },

  async getGuildInfo(guildName) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(20), guildName)
      .query('SELECT G_Name, G_Master, G_Mark, G_Score FROM Guild WHERE G_Name = @name');
    if (!result.recordset[0]) return null;
    const guild = result.recordset[0];

    const countRes = await pool.request()
      .input('name', sql.VarChar(20), guildName)
      .query('SELECT COUNT(Name) AS count FROM GuildMember WHERE G_Name = @name');

    return {
      name: guild.G_Name?.trim(),
      master: guild.G_Master?.trim(),
      score: guild.G_Score || 0,
      memberCount: countRes.recordset[0]?.count || 0,
    };
  },

  async getGuildMembers(guildName) {
    const pool = await getPool();
    const accountPool = await getPool(getAccountDb());

    const result = await pool.request()
      .input('guildName', sql.VarChar(20), guildName)
      .query(`
        SELECT g.Name, g.G_Status, c.Class, c.cLevel, c.AccountID,
               c.${RESET_COL} AS Resets, c.${GRESET_COL} AS GrandResets
        FROM GuildMember AS g
        LEFT JOIN Character AS c ON (g.Name Collate Database_Default = c.Name Collate Database_Default)
        WHERE g.G_Name = @guildName
        ORDER BY g.G_Status DESC, c.${RESET_COL} DESC, c.cLevel DESC
      `);

    const members = [];
    for (const row of result.recordset) {
      let isOnline = false;
      try {
        const onlineRes = await accountPool.request()
          .input('acc', sql.VarChar(10), row.AccountID?.trim())
          .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @acc');
        isOnline = onlineRes.recordset[0]?.ConnectStat === 1;
      } catch { /* empty */ }

      members.push({
        name: row.Name?.trim(),
        role: row.G_Status === 128 ? 'Guild Master' : row.G_Status === 64 ? 'Assistant' : 'Member',
        class: getClassName(row.Class),
        level: row.cLevel,
        resets: row.Resets || 0,
        grandResets: row.GrandResets || 0,
        isOnline,
      });
    }

    return members;
  },

  async getCharacterGuild(charName) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(10), charName)
      .query('SELECT G_Name FROM GuildMember WHERE Name = @name');
    return result.recordset[0]?.G_Name?.trim() || null;
  },

  async getCastleSiegeOwner() {
    const pool = await getPool();
    try {
      const result = await pool.request()
        .query("SELECT TOP 1 GUILD_OWNER FROM MuCastle_DATA WHERE MAP_SVR_GROUP = 0");
      return result.recordset[0]?.GUILD_OWNER?.trim() || null;
    } catch {
      return null;
    }
  },

  async searchGuilds(name) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(20), `%${name}%`)
      .query('SELECT G_Name FROM Guild WHERE G_Name LIKE @name');
    return result.recordset.map(r => r.G_Name?.trim());
  },
};

function getClassName(code) {
  const map = {
    0: 'Dark Wizard', 1: 'Soul Master', 3: 'Grand Master',
    16: 'Dark Knight', 17: 'Blade Knight', 19: 'Blade Master',
    32: 'Fairy Elf', 33: 'Muse Elf', 35: 'High Elf',
    48: 'Magic Gladiator', 49: 'Duel Master',
    64: 'Dark Lord', 65: 'Lord Emperor',
    80: 'Summoner', 81: 'Bloody Summoner', 83: 'Dimension Master',
    96: 'Rage Fighter', 98: 'Fist Master',
    112: 'Grow Lancer', 115: 'Mirage Lancer',
    128: 'Rune Wizard', 131: 'Rune Spell Master',
    144: 'Slayer', 147: 'Royal Slayer',
    160: 'Gun Crusher', 163: 'Master Gun Crusher',
    176: 'Light Wizard', 179: 'Shining Wizard',
    192: 'Lemuria Mage', 195: 'Warmage',
  };
  return map[code] ?? `Class ${code}`;
}

module.exports = GuildModel;

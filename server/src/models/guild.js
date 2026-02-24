const { sql, getPool } = require('../config/database');

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
      SELECT
        g.G_Name AS name,
        g.G_Mark AS logo,
        g.G_Score AS score,
        m.Name AS masterName,
        m.cLevel AS masterLevel,
        m.Resets AS masterResets,
        (SELECT COUNT(*) FROM GuildMember gm2 WHERE gm2.G_Name = g.G_Name) AS memberCount
      FROM Guild g
      LEFT JOIN GuildMember gm ON g.G_Name = gm.G_Name AND gm.G_Status = 128
      LEFT JOIN Character m ON gm.Name = m.Name
      ${where}
      ORDER BY g.G_Score DESC, memberCount DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      guilds: result.recordset.map((row) => ({
        name: row.name?.trim(),
        score: row.score || 0,
        masterName: row.masterName?.trim(),
        masterLevel: row.masterLevel,
        masterResets: row.masterResets || 0,
        memberCount: row.memberCount,
      })),
    };
  },

  async getGuildMembers(guildName) {
    const pool = await getPool();
    const result = await pool.request()
      .input('guildName', sql.VarChar(20), guildName)
      .query(`
        SELECT
          gm.Name,
          gm.G_Status,
          c.Class,
          c.cLevel AS Level,
          c.MasterLevel,
          c.Resets,
          c.GrandResets,
          CASE WHEN ms.ConnectStat = 1 THEN 1 ELSE 0 END AS IsOnline
        FROM GuildMember gm
        LEFT JOIN Character c ON gm.Name = c.Name
        LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
        LEFT JOIN MEMB_STAT ms ON ac.Id = ms.memb___id
        WHERE gm.G_Name = @guildName
        ORDER BY gm.G_Status DESC, c.Resets DESC, c.cLevel DESC
      `);

    return result.recordset.map((row) => ({
      name: row.Name?.trim(),
      role: row.G_Status === 128 ? 'Master' : row.G_Status === 64 ? 'Assistant' : 'Member',
      class: getClassName(row.Class),
      level: row.Level,
      masterLevel: row.MasterLevel || 0,
      resets: row.Resets || 0,
      grandResets: row.GrandResets || 0,
      isOnline: row.IsOnline === 1,
    }));
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
  };
  return map[code] ?? `Class ${code}`;
}

module.exports = GuildModel;

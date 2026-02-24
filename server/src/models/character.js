const { sql, getPool } = require('../config/database');

const CharacterModel = {
  async getRankings({ page = 1, limit = 20, className, search, serverCode }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;
    const request = pool.request()
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    let where = 'WHERE c.CtlCode <> 32';

    if (className && className !== 'All Classes') {
      request.input('class', sql.Int, mapClassNameToCode(className));
      where += ' AND c.Class = @class';
    }

    if (search) {
      request.input('search', sql.VarChar(10), `%${search}%`);
      where += ' AND c.Name LIKE @search';
    }

    if (serverCode) {
      request.input('serverCode', sql.TinyInt, serverCode);
      where += ' AND ac.GameIDC IS NOT NULL';
    }

    const result = await request.query(`
      SELECT
        c.Name,
        c.Class,
        c.cLevel AS Level,
        c.MasterLevel,
        c.Resets,
        c.GrandResets,
        CASE WHEN ms.ConnectStat = 1 THEN 1 ELSE 0 END AS IsOnline,
        ac.Id AS AccountId,
        ac.GameIDC AS Account
      FROM Character c
      LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
      LEFT JOIN MEMB_STAT ms ON ac.Id = ms.memb___id
      ${where}
      ORDER BY c.Resets DESC, c.cLevel DESC, c.MasterLevel DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM Character c
      LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
      ${where.replace(/@\w+/g, (m) => {
        if (m === '@class') return className ? mapClassNameToCode(className).toString() : '0';
        if (m === '@search') return search ? `'%${search}%'` : "''";
        return '0';
      })}
    `);

    return {
      characters: result.recordset.map(formatCharacter),
      total: countResult.recordset[0]?.total || 0,
    };
  },

  async getTopPlayers(limit = 5) {
    const pool = await getPool();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          c.Name,
          c.Class,
          c.cLevel AS Level,
          c.MasterLevel,
          c.Resets,
          c.GrandResets,
          CASE WHEN ms.ConnectStat = 1 THEN 1 ELSE 0 END AS IsOnline
        FROM Character c
        LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
        LEFT JOIN MEMB_STAT ms ON ac.Id = ms.memb___id
        WHERE c.CtlCode <> 32
        ORDER BY c.Resets DESC, c.cLevel DESC, c.MasterLevel DESC
      `);
    return result.recordset.map(formatCharacter);
  },

  async getCharactersByAccount(accountId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('accountId', sql.VarChar(10), accountId)
      .query(`
        SELECT
          c.Name,
          c.Class,
          c.cLevel AS Level,
          c.MasterLevel,
          c.Resets,
          c.GrandResets,
          c.Strength,
          c.Dexterity,
          c.Vitality,
          c.Energy,
          c.Leadership,
          c.Money,
          c.MapNumber,
          c.MapPosX,
          c.MapPosY,
          CASE WHEN ms.ConnectStat = 1 THEN 1 ELSE 0 END AS IsOnline
        FROM Character c
        LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
        LEFT JOIN MEMB_STAT ms ON ac.Id = ms.memb___id
        WHERE ac.Id = @accountId
      `);
    return result.recordset.map(formatCharacter);
  },

  async findByName(name) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(10), name)
      .query(`
        SELECT
          c.Name,
          c.Class,
          c.cLevel AS Level,
          c.MasterLevel,
          c.Resets,
          c.GrandResets,
          c.Strength,
          c.Dexterity,
          c.Vitality,
          c.Energy,
          c.Leadership,
          c.Money,
          CASE WHEN ms.ConnectStat = 1 THEN 1 ELSE 0 END AS IsOnline,
          g.G_Name AS GuildName,
          gm.G_Status AS GuildStatus
        FROM Character c
        LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
        LEFT JOIN MEMB_STAT ms ON ac.Id = ms.memb___id
        LEFT JOIN GuildMember gm ON c.Name = gm.Name
        LEFT JOIN Guild g ON gm.G_Name = g.G_Name
        WHERE c.Name = @name
      `);
    return result.recordset[0] ? formatCharacter(result.recordset[0]) : null;
  },

  async doReset(characterName, accountId, resetLevel, resetCost) {
    const pool = await getPool();
    const charResult = await pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('accountId', sql.VarChar(10), accountId)
      .query(`
        SELECT c.Name, c.cLevel AS Level, c.Resets, c.Money, ac.Id
        FROM Character c
        LEFT JOIN AccountCharacter ac ON c.AccountID = ac.Id
        WHERE c.Name = @name AND ac.Id = @accountId
      `);

    const char = charResult.recordset[0];
    if (!char) return { success: false, error: 'Character not found or not yours.' };
    if (char.Level < resetLevel) return { success: false, error: `Character must be level ${resetLevel} to reset.` };

    const isOnline = await pool.request()
      .input('accountId', sql.VarChar(10), accountId)
      .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @accountId');
    if (isOnline.recordset[0]?.ConnectStat === 1) {
      return { success: false, error: 'Character must be offline to reset.' };
    }

    await pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('resetCost', sql.BigInt, resetCost)
      .query(`
        UPDATE Character
        SET cLevel = 1,
            Resets = Resets + 1,
            Experience = 0,
            Strength = 25,
            Dexterity = 25,
            Vitality = 25,
            Energy = 25,
            LevelUpPoint = 0,
            Money = CASE WHEN Money >= @resetCost THEN Money - @resetCost ELSE Money END
        WHERE Name = @name
      `);

    return { success: true, newResets: char.Resets + 1 };
  },
};

function mapClassNameToCode(name) {
  const map = {
    'Dark Wizard': 0, 'Soul Master': 1, 'Grand Master': 3,
    'Dark Knight': 16, 'Blade Knight': 17, 'Blade Master': 19,
    'Fairy Elf': 32, 'Muse Elf': 33, 'High Elf': 35,
    'Magic Gladiator': 48, 'Duel Master': 49,
    'Dark Lord': 64, 'Lord Emperor': 65,
    'Summoner': 80, 'Bloody Summoner': 81, 'Dimension Master': 83,
    'Rage Fighter': 96, 'Fist Master': 98,
    'Grow Lancer': 112, 'Mirage Lancer': 115,
    'Rune Wizard': 128, 'Rune Spell Master': 131,
    'Slayer': 144, 'Royal Slayer': 147,
    'Gun Crusher': 160, 'Master Gun Crusher': 163,
    'Light Wizard': 176, 'Shining Wizard': 179,
    'Lemuria Mage': 192, 'Warmage': 195,
  };
  return map[name] ?? -1;
}

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

function formatCharacter(row) {
  return {
    name: row.Name?.trim(),
    class: getClassName(row.Class),
    classCode: row.Class,
    level: row.Level,
    masterLevel: row.MasterLevel || 0,
    resets: row.Resets || 0,
    grandResets: row.GrandResets || 0,
    isOnline: row.IsOnline === 1,
    strength: row.Strength,
    dexterity: row.Dexterity,
    vitality: row.Vitality,
    energy: row.Energy,
    leadership: row.Leadership,
    money: row.Money,
    mapNumber: row.MapNumber,
    mapPosX: row.MapPosX,
    mapPosY: row.MapPosY,
    guildName: row.GuildName?.trim(),
    guildStatus: row.GuildStatus,
    account: row.Account?.trim(),
  };
}

module.exports = CharacterModel;

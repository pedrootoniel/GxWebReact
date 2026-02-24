const { sql, getPool, getAccountDb } = require('../config/database');

const RESET_COL = process.env.RESET_COLUMN || 'Resets';
const GRESET_COL = process.env.GRESET_COLUMN || 'GrandResets';
const RESET_LEVEL = parseInt(process.env.RESET_LEVEL || '400');
const RESET_MONEY = parseInt(process.env.RESET_MONEY || '0');
const LEVEL_AFTER_RESET = parseInt(process.env.LEVEL_AFTER_RESET || '1');

const CharacterModel = {
  async getCharacterList(accountId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('account', sql.VarChar(10), accountId)
      .query(`
        SELECT Name, cLevel, Class, ${RESET_COL} AS Resets, ${GRESET_COL} AS GrandResets,
               Money, LevelUpPoint, CtlCode, PkCount, PkLevel
        FROM Character WHERE AccountID = @account
      `);
    return result.recordset.map(formatCharacter);
  },

  async getCharacterDetail(name) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(10), name)
      .query(`
        SELECT AccountID, Name, Money, Class, cLevel, ${RESET_COL} AS Resets, ${GRESET_COL} AS GrandResets,
               LevelUpPoint, Strength, Dexterity, Vitality, Energy, Leadership,
               PkLevel, PkCount, CtlCode, MapNumber, MapPosX, MapPosY
        FROM Character WHERE Name = @name
      `);
    return result.recordset[0] ? formatCharacterFull(result.recordset[0]) : null;
  },

  async getRankings({ page = 1, limit = 20, className, search }) {
    const pool = await getPool();
    const accountPool = await getPool(getAccountDb());
    const offset = (page - 1) * limit;
    const request = pool.request()
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    let where = 'WHERE c.CtlCode <> 32';

    if (className && className !== 'All Classes') {
      const code = mapClassNameToCode(className);
      if (code >= 0) {
        request.input('class', sql.Int, code);
        where += ' AND c.Class = @class';
      }
    }

    if (search) {
      request.input('search', sql.VarChar(10), `%${search}%`);
      where += ' AND c.Name LIKE @search';
    }

    const result = await request.query(`
      SELECT c.Name, c.Class, c.cLevel, c.${RESET_COL} AS Resets, c.${GRESET_COL} AS GrandResets,
             c.AccountID
      FROM Character AS c
      ${where}
      ORDER BY c.${RESET_COL} DESC, c.cLevel DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countReq = pool.request();
    let countWhere = 'WHERE c.CtlCode <> 32';
    if (className && className !== 'All Classes') {
      const code = mapClassNameToCode(className);
      if (code >= 0) {
        countReq.input('class', sql.Int, code);
        countWhere += ' AND c.Class = @class';
      }
    }
    if (search) {
      countReq.input('search', sql.VarChar(10), `%${search}%`);
      countWhere += ' AND c.Name LIKE @search';
    }
    const countResult = await countReq.query(`SELECT COUNT(*) AS total FROM Character AS c ${countWhere}`);

    const characters = [];
    for (const row of result.recordset) {
      let isOnline = false;
      try {
        const onlineRes = await accountPool.request()
          .input('acc', sql.VarChar(10), row.AccountID?.trim())
          .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @acc');
        isOnline = onlineRes.recordset[0]?.ConnectStat === 1;
      } catch { /* empty */ }

      characters.push({
        name: row.Name?.trim(),
        class: getClassName(row.Class),
        classCode: row.Class,
        level: row.cLevel,
        resets: row.Resets || 0,
        grandResets: row.GrandResets || 0,
        isOnline,
      });
    }

    return {
      characters,
      total: countResult.recordset[0]?.total || 0,
    };
  },

  async getTopPlayers(limit = 5) {
    const pool = await getPool();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) c.Name, c.Class, c.cLevel, c.${RESET_COL} AS Resets, c.${GRESET_COL} AS GrandResets
        FROM Character AS c
        WHERE c.CtlCode <> 32
        ORDER BY c.${RESET_COL} DESC, c.cLevel DESC
      `);
    return result.recordset.map(row => ({
      name: row.Name?.trim(),
      class: getClassName(row.Class),
      classCode: row.Class,
      level: row.cLevel,
      resets: row.Resets || 0,
      grandResets: row.GrandResets || 0,
    }));
  },

  async getCharactersByAccount(accountId) {
    const pool = await getPool();
    const accountPool = await getPool(getAccountDb());
    const result = await pool.request()
      .input('account', sql.VarChar(10), accountId)
      .query(`
        SELECT Name, Class, cLevel, ${RESET_COL} AS Resets, ${GRESET_COL} AS GrandResets,
               Strength, Dexterity, Vitality, Energy, Leadership, Money, LevelUpPoint,
               MapNumber, MapPosX, MapPosY, PkCount, PkLevel
        FROM Character WHERE AccountID = @account
      `);

    let isOnline = false;
    try {
      const onlineRes = await accountPool.request()
        .input('acc', sql.VarChar(10), accountId)
        .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @acc');
      isOnline = onlineRes.recordset[0]?.ConnectStat === 1;
    } catch { /* empty */ }

    return result.recordset.map(row => ({
      ...formatCharacterFull(row),
      isOnline,
    }));
  },

  async findByName(name) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(10), name)
      .query(`
        SELECT c.AccountID, c.Name, c.Class, c.cLevel, c.${RESET_COL} AS Resets, c.${GRESET_COL} AS GrandResets,
               c.Strength, c.Dexterity, c.Vitality, c.Energy, c.Leadership,
               c.Money, c.LevelUpPoint, c.PkLevel, c.PkCount,
               c.MapNumber, c.MapPosX, c.MapPosY,
               gm.G_Name AS GuildName, gm.G_Status AS GuildStatus
        FROM Character AS c
        LEFT JOIN GuildMember AS gm ON (c.Name Collate Database_Default = gm.Name Collate Database_Default)
        WHERE c.Name = @name
      `);
    if (!result.recordset[0]) return null;

    const row = result.recordset[0];
    const accountPool = await getPool(getAccountDb());
    let isOnline = false;
    try {
      const onlineRes = await accountPool.request()
        .input('acc', sql.VarChar(10), row.AccountID?.trim())
        .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @acc');
      isOnline = onlineRes.recordset[0]?.ConnectStat === 1;
    } catch { /* empty */ }

    return {
      ...formatCharacterFull(row),
      isOnline,
      guildName: row.GuildName?.trim() || null,
      guildStatus: row.GuildStatus,
    };
  },

  async doReset(characterName, accountId) {
    const pool = await getPool();
    const accountPool = await getPool(getAccountDb());

    const charResult = await pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('account', sql.VarChar(10), accountId)
      .query(`
        SELECT Name, cLevel, ${RESET_COL} AS Resets, Money, AccountID
        FROM Character
        WHERE Name = @name AND AccountID = @account
      `);

    const char = charResult.recordset[0];
    if (!char) return { success: false, error: 'Character not found or does not belong to your account.' };
    if (char.cLevel < RESET_LEVEL) return { success: false, error: `Character must be level ${RESET_LEVEL} to reset.` };

    if (RESET_MONEY > 0 && char.Money < RESET_MONEY) {
      return { success: false, error: `Not enough Zen. You need ${RESET_MONEY} Zen to reset.` };
    }

    const onlineRes = await accountPool.request()
      .input('account', sql.VarChar(10), accountId)
      .query('SELECT ConnectStat FROM MEMB_STAT WHERE memb___id = @account');
    if (onlineRes.recordset[0]?.ConnectStat === 1) {
      return { success: false, error: 'You must be disconnected from the game to reset.' };
    }

    let resetQuery;
    if (RESET_MONEY > 0) {
      resetQuery = `
        UPDATE Character
        SET ${RESET_COL} = ${RESET_COL} + 1, cLevel = ${LEVEL_AFTER_RESET},
            Money = Money - @resetMoney, Experience = 0
        WHERE Name = @name AND AccountID = @account
      `;
    } else {
      resetQuery = `
        UPDATE Character
        SET ${RESET_COL} = ${RESET_COL} + 1, cLevel = ${LEVEL_AFTER_RESET}, Experience = 0
        WHERE Name = @name AND AccountID = @account
      `;
    }

    const req = pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('account', sql.VarChar(10), accountId);
    if (RESET_MONEY > 0) {
      req.input('resetMoney', sql.BigInt, RESET_MONEY);
    }
    await req.query(resetQuery);

    return { success: true, newResets: (char.Resets || 0) + 1 };
  },

  async addStats(characterName, accountId, str, agi, vit, ene, cmd) {
    const pool = await getPool();
    let leadershipSet = '';
    const request = pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('account', sql.VarChar(10), accountId)
      .input('str', sql.Int, str || 0)
      .input('agi', sql.Int, agi || 0)
      .input('vit', sql.Int, vit || 0)
      .input('ene', sql.Int, ene || 0);

    if (cmd !== undefined && cmd !== null) {
      request.input('cmd', sql.Int, cmd);
      leadershipSet = ', Leadership = @cmd';
    }

    const totalPoints = (str || 0) + (agi || 0) + (vit || 0) + (ene || 0) + (cmd || 0);
    request.input('totalPoints', sql.Int, totalPoints);

    await request.query(`
      UPDATE Character
      SET Strength = Strength + @str, Dexterity = Dexterity + @agi,
          Vitality = Vitality + @vit, Energy = Energy + @ene${leadershipSet},
          LevelUpPoint = LevelUpPoint - @totalPoints
      WHERE Name = @name AND AccountID = @account AND LevelUpPoint >= @totalPoints
    `);
  },

  async clearPk(characterName, accountId) {
    const pool = await getPool();
    await pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('account', sql.VarChar(10), accountId)
      .query('UPDATE Character SET PkLevel = 3, PkCount = 0 WHERE Name = @name AND AccountID = @account');
  },

  async unstick(characterName, accountId) {
    const pool = await getPool();
    await pool.request()
      .input('name', sql.VarChar(10), characterName)
      .input('account', sql.VarChar(10), accountId)
      .query('UPDATE Character SET MapNumber = 0, MapPosX = 125, MapPosY = 125 WHERE Name = @name AND AccountID = @account');
  },

  async getAccountCharacters(accountId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('account', sql.VarChar(10), accountId)
      .query('SELECT Name FROM Character WHERE AccountID = @account');
    return result.recordset.map(r => r.Name?.trim());
  },

  async searchCharacters(name) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar(10), `%${name}%`)
      .query(`
        SELECT c.Name, c.Class, c.cLevel, c.${RESET_COL} AS Resets, c.${GRESET_COL} AS GrandResets, c.AccountID
        FROM Character AS c
        WHERE c.Name LIKE @name
      `);
    return result.recordset.map(formatCharacter);
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
    level: row.cLevel,
    resets: row.Resets || 0,
    grandResets: row.GrandResets || 0,
  };
}

function formatCharacterFull(row) {
  return {
    name: row.Name?.trim(),
    class: getClassName(row.Class),
    classCode: row.Class,
    level: row.cLevel,
    resets: row.Resets || 0,
    grandResets: row.GrandResets || 0,
    strength: row.Strength,
    dexterity: row.Dexterity,
    vitality: row.Vitality,
    energy: row.Energy,
    leadership: row.Leadership,
    money: row.Money,
    levelUpPoint: row.LevelUpPoint,
    pkLevel: row.PkLevel,
    pkCount: row.PkCount,
    mapNumber: row.MapNumber,
    mapPosX: row.MapPosX,
    mapPosY: row.MapPosY,
  };
}

module.exports = CharacterModel;

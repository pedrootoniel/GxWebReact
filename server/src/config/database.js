const sql = require('mssql');

const baseConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pools = {};

async function getPool(dbName) {
  const database = dbName || process.env.DB_DATABASE || 'MuOnline';
  if (!pools[database]) {
    pools[database] = await sql.connect({ ...baseConfig, database });
    console.log(`[DB] Connected to SQL Server: ${database}`);
  }
  return pools[database];
}

function getGameDb() {
  return process.env.DB_GAME || process.env.DB_DATABASE || 'MuOnline';
}

function getAccountDb() {
  return process.env.DB_ACCOUNT || process.env.DB_DATABASE || 'MuOnline';
}

function getWebDb() {
  return process.env.DB_WEB || 'dmncms';
}

async function closeAllPools() {
  for (const [name, pool] of Object.entries(pools)) {
    try {
      await pool.close();
      console.log(`[DB] Closed pool: ${name}`);
    } catch (err) {
      console.error(`[DB] Error closing pool ${name}:`, err.message);
    }
  }
}

module.exports = { sql, getPool, getGameDb, getAccountDb, getWebDb, closeAllPools };

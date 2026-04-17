import mysql from 'mysql2/promise';

let pool = null;

export const getDbPool = () => {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    pool = mysql.createPool({
      host: url.hostname,
      port: parseInt(url.port || '4000'),
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      ssl: { rejectUnauthorized: true },
      enableKeepAlive: true,
      connectionLimit: 20,
      waitForConnections: true,
    });
    console.log('✅ Using DATABASE_URL (TiDB Cloud)');
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'foodieapp',
      connectionLimit: 20,
      ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
    });
    console.log('✅ Using local DB_ variables');
  }
  return pool;
};
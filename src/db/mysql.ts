import mysql from 'mysql2/promise';
import { IS_PROD } from '../config';

let pool: mysql.Pool | null = null;

const getRequiredMysqlConfig = () => ({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
});

export function getMysqlPool() {
  if (!IS_PROD) {
    return null;
  }

  const config = getRequiredMysqlConfig();
  const hasRequiredConfig = config.host && config.user && config.password && config.database;

  if (!hasRequiredConfig) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    });
  }

  return pool;
}

import { Pool } from 'pg';
import { logger } from '../lib/logger';

class DataService {
  private pool: Pool;
  private static instance: DataService;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error(err, 'Unexpected error on idle PostgreSQL client');
    });
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug({ text, duration, rows: res.rowCount }, 'Executed query');
      return res;
    } catch (error) {
      logger.error({ text, error }, 'Database query error');
      throw error;
    }
  }

  public async getClient() {
    return await this.pool.connect();
  }

  public async close() {
    await this.pool.end();
  }
}

export const dbProvider = DataService.getInstance();

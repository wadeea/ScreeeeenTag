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
    // Graceful fallback for demo/preview without real Postgres
    if (!process.env.DATABASE_URL) {
      logger.warn({ text }, "Using mock response (DATABASE_URL missing)");
      return this.mockQuery(text);
    }

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

  private mockQuery(text: string): { rows: any[], rowCount: number } {
    if (text.includes('FROM products')) {
      return { 
        rows: [
          { id: '1', sku: 'PRD-001', name: 'Fresh Milk 1L', price: 2.50, currency: '$', category: 'Dairy' },
          { id: '2', sku: 'PRD-002', name: 'Organic Bananas', price: 1.20, currency: '$', category: 'Fruit' },
        ],
        rowCount: 2 
      };
    }
    if (text.includes('FROM tags')) {
      return {
        rows: [
          { id: 'TAG-HEX-01', status: 'READY', battery_level: 85, signal_strength: -65, last_seen: new Date(), ap_id: 'AP-01', product_name: 'Fresh Milk 1L', product_price: 2.50, product_sku: 'PRD-001' }
        ],
        rowCount: 1
      };
    }
    if (text.includes('FROM access_points')) {
      return {
        rows: [{ id: 'AP-01', status: 'ONLINE', ip_address: '192.168.1.50', last_seen: new Date() }],
        rowCount: 1
      };
    }
    return { rows: [], rowCount: 0 };
  }

  public async getClient() {
    if (!process.env.DATABASE_URL) {
      // Return a mock client with a mock query method for transactions
      return {
        query: (text: string, params?: any[]) => this.mockQuery(text),
        release: () => {},
      } as any;
    }
    return await this.pool.connect();
  }

  public async close() {
    if (process.env.DATABASE_URL) {
      await this.pool.end();
    }
  }
}

export const dbProvider = DataService.getInstance();

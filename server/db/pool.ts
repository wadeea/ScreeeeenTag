import { Pool } from 'pg';
import { logger } from '../lib/logger';
import { ProductRepository } from './repositories/ProductRepository';

class DatabaseContext {
  private pool: Pool;
  private static instance: DatabaseContext;
  
  // Public Repositories (Initialized with pool)
  public products: ProductRepository;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Production settings
      max: process.env.NODE_ENV === 'production' ? 50 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error(err, 'PostgreSQL Pool Error');
    });

    // Initialize Repositories
    this.products = new ProductRepository(this.pool);
  }

  public static getInstance(): DatabaseContext {
    if (!DatabaseContext.instance) {
      DatabaseContext.instance = new DatabaseContext();
    }
    return DatabaseContext.instance;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (err) {
      logger.error(err, 'Database Health Check Failed');
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down PostgreSQL pool');
    await this.pool.end();
  }
}

export const dbContext = DatabaseContext.getInstance();

import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../../lib/logger';

export class BaseRepository {
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  protected async executeQuery<T>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug({ duration, rowCount: res.rowCount }, 'Query Executed');
      return res;
    } catch (err) {
      logger.error(err, 'Repository Query Error');
      throw err;
    }
  }

  public async getTransaction(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }
}

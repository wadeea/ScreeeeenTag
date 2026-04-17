import { BaseRepository } from './BaseRepository';
import { Product } from '../../../src/types';

export class ProductRepository extends BaseRepository {
  
  public async findBySku(sku: string): Promise<Product | null> {
    const res = await this.executeQuery<Product>(
      'SELECT * FROM products WHERE sku = $1',
      [sku]
    );
    return res.rows[0] || null;
  }

  public async updatePrice(productId: string, newPrice: number, userId?: string): Promise<void> {
    const client = await this.getTransaction();
    try {
      await client.query('BEGIN');
      
      // Update Product
      await client.query(
        'UPDATE products SET price = $1, last_modified_by = $2, updated_at = NOW() WHERE id = $3',
        [newPrice, userId, productId]
      );
      
      // Mark bindings as dirty so Renderer knows to update tags
      await client.query(
        'UPDATE bindings SET is_dirty = TRUE, updated_at = NOW() WHERE product_id = $3',
        [productId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async getAll(): Promise<Product[]> {
    const res = await this.executeQuery<Product>('SELECT * FROM products ORDER BY name ASC');
    return res.rows;
  }
}

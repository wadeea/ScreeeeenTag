import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import 'express-async-errors';
import path from 'path';

import { logger } from './server/lib/logger';
import { dbProvider } from './server/services/dbProvider';
import { MqttService } from './server/services/mqttService';
import { DeviceStateHandler } from './server/services/deviceStateHandler';
import { QueueService } from './server/services/queueService';
// Import worker to ensure it starts
import './server/workers/taskWorker';

async function startProductionServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  app.use(express.json());

  // 1. Core Services Init
  const mqtt = MqttService.getInstance();
  new DeviceStateHandler(io);

  // 2. Production API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date(), version: '2.0.0-prod' });
  });

  app.get('/api/products', async (req, res) => {
    const result = await dbProvider.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  });

  app.get('/api/tags', async (req, res) => {
    const result = await dbProvider.query(`
      SELECT t.*, p.name as product_name, p.price as product_price, p.sku as product_sku
      FROM tags t
      LEFT JOIN bindings b ON t.id = b.tag_id
      LEFT JOIN products p ON b.product_id = p.id
    `);
    res.json(result.rows);
  });

  app.post('/api/tags/bind', async (req, res) => {
    const { tagId, sku } = req.body;
    
    // transactional binding + task creation
    const client = await dbProvider.getClient();
    try {
      await client.query('BEGIN');
      
      const prodRes = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
      if (prodRes.rowCount === 0) throw new Error('Product SKU invalid');
      const productId = prodRes.rows[0].id;

      // Upsert Binding
      await client.query(
        `INSERT INTO bindings (tag_id, product_id, updated_at) 
         VALUES ($1, $2, NOW())
         ON CONFLICT (tag_id) DO UPDATE SET product_id = EXCLUDED.product_id, updated_at = NOW()`,
        [tagId, productId]
      );

      // Create Task
      const taskRes = await client.query(
        `INSERT INTO tasks (type, target_id, status)
         VALUES ($1, $2, $3) RETURNING id`,
        ['UPDATE_IMAGE', tagId, 'PENDING']
      );
      const taskId = taskRes.rows[0].id;

      await client.query('COMMIT');

      // 3. Queue Background Job via BullMQ
      await QueueService.addTask({ taskId, targetId: tagId, sku });

      res.status(201).json({ success: true, taskId });
    } catch (err: any) {
      await client.query('ROLLBACK');
      logger.error(err, 'Binding transaction failed');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  app.get('/api/tasks', async (req, res) => {
    const result = await dbProvider.query('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  });

  // 4. Vite Middleware / Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  // Handle errors globally
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error(err);
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚨 OmniESL Production Platform listening on http://0.0.0.0:${PORT}`);
  });
}

startProductionServer().catch((err) => {
  console.error('SERVER FATAL STARTUP ERROR', err);
  process.exit(1);
});

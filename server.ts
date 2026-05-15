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
import { renderer } from './server/services/rendererService';
import { getSpecFromId } from './server/constants/hardwareSpecs';
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

  // Request Logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

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
    const { tag_id, sku } = req.body;
    
    const client = await dbProvider.getClient();
    try {
      await client.query('BEGIN');
      
      const prodRes = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
      if (prodRes.rowCount === 0) throw new Error('Product SKU invalid');
      const productId = prodRes.rows[0].id;

      // 1. Auto-Detect Hardware Specs
      const spec = getSpecFromId(tag_id);
      
      // 2. Ensure Tag exists with correct type
      await client.query(
        `INSERT INTO tags (id, type, status) 
         VALUES ($1, $2, 'READY')
         ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type`,
        [tag_id, `${spec.model} (${spec.size})`]
      );

      // 3. Upsert Binding
      await client.query(
        `INSERT INTO bindings (tag_id, product_id, updated_at) 
         VALUES ($1, $2, NOW())
         ON CONFLICT (tag_id) DO UPDATE SET product_id = EXCLUDED.product_id, updated_at = NOW()`,
        [tag_id, productId]
      );

      // 4. Find Target AP
      const tagRes = await client.query('SELECT current_ap_id FROM tags WHERE id = $1', [tag_id]);
      const apId = tagRes.rows[0]?.current_ap_id || '01'; // Default or discovery

      // Create Task
      const taskRes = await client.query(
        `INSERT INTO tasks (type, target_tag_id, ap_id, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['IMAGE_UPDATE', tag_id, apId, 'PENDING']
      );
      const taskId = taskRes.rows[0].id;

      await client.query('COMMIT');
      await QueueService.addTask({ taskId, targetId: tag_id, sku });

      res.status(201).json({ success: true, taskId, detectedModel: spec.model });
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

  app.get('/api/aps', async (req, res) => {
    const result = await dbProvider.query('SELECT * FROM access_points ORDER BY id ASC');
    res.json(result.rows);
  });

  app.get('/api/test/preview', async (req, res) => {
    const product = {
      name: 'Cabernet Sauvignon',
      sku: 'WINE-750-RED',
      price: 89.90,
      currency: 'ILS'
    };
    
    // Render using the high-res 7.5" profile
    const buffer = await renderer.generateEInkBitmap(product as any, 800, 480);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
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

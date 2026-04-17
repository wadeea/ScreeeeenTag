import { Worker, Job } from 'bullmq';
import { redisConnection, TASK_QUEUE_NAME } from '../services/queueService';
import { dbProvider } from '../services/dbProvider';
import { MqttService } from '../services/mqttService';
import { renderer } from '../services/rendererService';
import { logger } from '../lib/logger';

export const taskWorker = new Worker(
  TASK_QUEUE_NAME,
  async (job: Job) => {
    const { taskId, targetId, sku } = job.data;
    logger.info({ taskId, targetId }, 'Processing task started');

    try {
      // 1. Mark task as PROCESSING (SENT stage)
      await dbProvider.query(
        'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
        ['SENT', taskId]
      );

      // 2. Fetch Product Data
      const prodRes = await dbProvider.query('SELECT * FROM products WHERE sku = $1', [sku]);
      if (prodRes.rowCount === 0) throw new Error(`Product not found: ${sku}`);
      const product = prodRes.rows[0];

      // 3. Render Image Node (Advanced Render)
      const buffer = await renderer.generateEInkBitmap(product);
      
      // 4. Find Target Tag and AP
      const tagRes = await dbProvider.query('SELECT ap_id FROM tags WHERE id = $1', [targetId]);
      if (tagRes.rowCount === 0) throw new Error(`Tag not found: ${targetId}`);
      const apId = tagRes.rows[0].ap_id;

      // 5. Publish to MQTT via AP
      const mqtt = MqttService.getInstance();
      await mqtt.publish(`/estation/${apId}/task`, {
        taskId,
        tagId: targetId,
        type: 'UPDATE',
        payload: buffer.toString('base64'),
        timestamp: Date.now()
      });

      logger.info({ taskId, apId, targetId }, 'Payload dispatched to Access Point');
      
      return { status: 'SENT' };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Task worker failure');
      
      await dbProvider.query(
        'UPDATE tasks SET status = $1, error_log = $2, updated_at = NOW() WHERE id = $3',
        ['FAILED', error.message, taskId]
      );
      
      throw error; // Let BullMQ handle retry
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

taskWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Task job completed');
});

taskWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Task job failed');
});

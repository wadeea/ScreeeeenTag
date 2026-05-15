import { Worker, Job } from 'bullmq';
import { redisConnection, TASK_QUEUE_NAME } from '../services/queueService';
import { dbProvider } from '../services/dbProvider';
import { MqttService } from '../services/mqttService';
import { renderer } from '../services/rendererService';
import { etagAdapter } from '../services/etagAdapter';
import { getSpecFromId } from '../constants/hardwareSpecs';
import { logger } from '../lib/logger';

export const taskWorker = new Worker(
  TASK_QUEUE_NAME,
  async (job: Job) => {
    const { taskId, targetId, sku } = job.data;
    logger.info({ taskId, targetId }, 'Processing task started');

    try {
      // 1. Mark task as PROCESSING (SENT stage)
      await job.updateProgress(10);
      await dbProvider.query(
        'UPDATE tasks SET status = $1, updated_at = NOW(), retry_count = $2 WHERE id = $3',
        ['SENT', job.attemptsMade, taskId]
      );

      // 2. Fetch Product Data
      await job.updateProgress(30);
      const prodRes = await dbProvider.query('SELECT * FROM products WHERE sku = $1', [sku]);
      if (prodRes.rowCount === 0) throw new Error(`Product not found: ${sku}`);
      const product = prodRes.rows[0];

      // 3. Detect Tag Resolution
      const spec = getSpecFromId(targetId);
      logger.info({ targetId, model: spec.model }, 'Task target specs detected');

      // 4. Render Image Node (Model-Specific Render)
      await job.updateProgress(60);
      const buffer = await renderer.generateEInkBitmap(
        product, 
        spec.resolution.width, 
        spec.resolution.height
      );
      
      // 5. Find Target AP
      const tagRes = await dbProvider.query('SELECT current_ap_id FROM tags WHERE id = $1', [targetId]);
      if (tagRes.rowCount === 0) throw new Error(`Tag not found: ${targetId}`);
      const apId = tagRes.rows[0].current_ap_id;

      // 5. Encode Hardware Command & Publish
      await job.updateProgress(90);
      const mqtt = MqttService.getInstance();
      
      const payload = etagAdapter.encodeTask({
        taskId,
        tagId: targetId,
        payload: buffer.toString('base64') // Explicit Base64 for AP04
      });

      await mqtt.publish(`/estation/${apId}/taskESL`, payload);

      logger.info({ taskId, apId, targetId, attempt: job.attemptsMade }, 'Binary payload dispatched to taskESL');
      await job.updateProgress(100);
      
      return { status: 'SENT', taskId };
    } catch (error: any) {
      logger.error({ taskId, error: error.message }, 'Task worker failure');
      
      await dbProvider.query(
        'UPDATE tasks SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
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

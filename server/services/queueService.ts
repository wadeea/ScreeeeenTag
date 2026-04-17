import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../lib/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const TASK_QUEUE_NAME = 'esl-task-queue';

export class QueueService {
  private static taskQueue = new Queue(TASK_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  public static async addTask(payload: any) {
    const job = await this.taskQueue.add('process-tag-update', payload);
    logger.info({ jobId: job.id, targetId: payload.targetId }, 'Task added to BullMQ');
    return job;
  }
}

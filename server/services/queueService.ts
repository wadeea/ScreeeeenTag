import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../lib/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisConnection.on('error', (err) => {
  logger.error(err, 'Redis connection error - background tasks might fail');
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
      removeOnComplete: {
        age: 3600, // keep for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 3600, // keep failed for 24 hours
      },
    },
  });

  public static queueEvents = new QueueEvents(TASK_QUEUE_NAME, {
    connection: redisConnection,
  });

  public static async addTask(payload: any) {
    const job = await this.taskQueue.add('process-tag-update', payload, {
      priority: payload.priority || 10,
    });
    logger.info({ jobId: job.id, targetId: payload.targetId, type: payload.type }, 'Task added to BullMQ');
    return job;
  }

  public static async getJobStatus(jobId: string) {
    const job = await this.taskQueue.getJob(jobId);
    return job ? await job.getState() : 'not_found';
  }
}

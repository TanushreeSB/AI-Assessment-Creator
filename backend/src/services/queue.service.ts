import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

type JobHandler = (assignmentId: string) => Promise<void>;

class MemoryQueue {
  private jobs: Array<{ assignmentId: string }> = [];
  private isProcessing = false;
  private handler: JobHandler | null = null;

  setHandler(handler: JobHandler) {
    this.handler = handler;
  }

  async add(assignmentId: string) {
    console.log(`[MemoryQueue] Job added for assignment: ${assignmentId}`);
    this.jobs.push({ assignmentId });
    this.processNext();
    return { id: assignmentId };
  }

  private async processNext() {
    if (this.isProcessing || !this.handler || this.jobs.length === 0) return;
    this.isProcessing = true;

    const job = this.jobs.shift();
    if (job && this.handler) {
      try {
        console.log(`[MemoryQueue] Processing job for assignment: ${job.assignmentId}`);
        await this.handler(job.assignmentId);
        console.log(`[MemoryQueue] Completed job for assignment: ${job.assignmentId}`);
      } catch (error) {
        console.error(`[MemoryQueue] Job failed for assignment: ${job.assignmentId}`, error);
      }
    }

    this.isProcessing = false;
    this.processNext(); // Process any remaining jobs in the queue
  }
}

class QueueService {
  private bullQueue: Queue | null = null;
  private bullWorker: Worker | null = null;
  private memoryQueue = new MemoryQueue();
  private isRedisUsed = false;

  async init(redisUrl: string, handler: JobHandler) {
    try {
      console.log(`Connecting to Redis at: ${redisUrl}...`);
      const connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000, // 2 seconds timeout
      });

      // Handle redis error event to prevent crashes
      connection.on('error', (err) => {
        // Log quietly since we fallback
      });

      await new Promise<void>((resolve, reject) => {
        connection.once('connect', () => resolve());
        connection.once('error', (err) => reject(err));
        setTimeout(() => reject(new Error('Redis connection timeout')), 2000);
      });

      this.bullQueue = new Queue('assignment-generation', { connection });
      this.bullWorker = new Worker('assignment-generation', async (job) => {
        console.log(`[BullMQ Worker] Processing job ${job.id} for assignment: ${job.data.assignmentId}`);
        await handler(job.data.assignmentId);
      }, { connection });

      this.isRedisUsed = true;
      console.log('Successfully connected to Redis. BullMQ initialized.');
    } catch (error) {
      console.warn('Redis is not available. Falling back to local InMemoryQueue.');
      this.memoryQueue.setHandler(handler);
      this.isRedisUsed = false;
    }
  }

  async addJob(assignmentId: string) {
    if (this.isRedisUsed && this.bullQueue) {
      await this.bullQueue.add(`generate-${assignmentId}`, { assignmentId });
      console.log(`[BullMQ] Added job for assignment: ${assignmentId}`);
    } else {
      await this.memoryQueue.add(assignmentId);
    }
  }
}

export const queueService = new QueueService();

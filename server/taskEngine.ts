import { getDb } from './db';
import { MqttService } from './mqttService';
import { v4 as uuidv4 } from 'uuid';

export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class TaskEngine {
  private mqtt: MqttService;
  private isProcessing = false;

  constructor() {
    this.mqtt = MqttService.getInstance();
    this.startLoop();
  }

  private async startLoop() {
    setInterval(() => this.processNextBatch(), 5000);
  }

  private async processNextBatch() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const db = await getDb();
      const tasks = await db.all(
        'SELECT * FROM tasks WHERE status = ? LIMIT 5',
        [TaskStatus.PENDING]
      );

      for (const task of tasks) {
        await this.executeTask(task);
      }
    } catch (err) {
      console.error('Task Engine Loop Error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: any) {
    const db = await getDb();
    
    try {
      await db.run('UPDATE tasks SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', 
        [TaskStatus.PROCESSING, task.id]);

      const payload = JSON.parse(task.payload);
      
      // Target topic: /estation/{apId}/task
      // We look up the AP for the tag
      const tag = await db.get('SELECT apId FROM tags WHERE tagId = ?', [task.targetId]);
      
      if (!tag || !tag.apId) {
        throw new Error('No Access Point associated with this tag');
      }

      this.mqtt.publish(`/estation/${tag.apId}/task`, {
        taskId: task.id,
        tagId: task.targetId,
        type: task.type,
        data: payload
      });

      // Update log
      await db.run('UPDATE tasks SET logs = ? WHERE id = ?', 
        [`Published to MQTT topic /estation/${tag.apId}/task`, task.id]);

    } catch (err: any) {
      console.error(`Task ${task.id} failed:`, err);
      await db.run('UPDATE tasks SET status = ?, logs = ? WHERE id = ?', 
        [TaskStatus.FAILED, err.message, task.id]);
    }
  }

  public static async createTask(type: string, targetId: string, payload: any) {
    const db = await getDb();
    const id = uuidv4();
    await db.run(
      'INSERT INTO tasks (id, type, targetId, payload, status) VALUES (?, ?, ?, ?, ?)',
      [id, type, targetId, JSON.stringify(payload), TaskStatus.PENDING]
    );
    return id;
  }
}

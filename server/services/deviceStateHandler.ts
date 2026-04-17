import { MqttService } from './mqttService';
import { dbProvider } from './dbProvider';
import { logger } from '../lib/logger';
import { Server as SocketServer } from 'socket.io';

export class DeviceStateHandler {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
    this.init();
  }

  private init() {
    const mqtt = MqttService.getInstance();

    // 1. Handle AP Heartbeats
    mqtt.on('ap:heartbeat', async (data) => {
      const { apId, ip, version, status } = data;
      logger.debug({ apId }, 'Heartbeat received from AP');

      await dbProvider.query(
        `INSERT INTO access_points (id, ip_address, firmware_version, status, last_seen)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET
         ip_address = EXCLUDED.ip_address,
         firmware_version = EXCLUDED.firmware_version,
         status = EXCLUDED.status,
         last_seen = EXCLUDED.last_seen`,
        [apId, ip, version, status || 'ONLINE']
      );

      this.io.emit('ap:status', { apId, status: 'ONLINE', lastSeen: new Date() });
    });

    // 2. Handle Task Results (SENT -> ACK -> DISPLAYED)
    mqtt.on('task:result', async (data) => {
      const { taskId, tagId, status, battery, rssi, type } = data;
      logger.info({ taskId, tagId, status, type }, 'Task event received');

      // Handle intermediate ACK stage
      if (type === 'ACK') {
        await dbProvider.query(
          'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
          ['ACK', taskId]
        );
        this.io.emit('task:update', { taskId, status: 'ACK' });
        return;
      }

      // Handle final result stage (DISPLAYED / FAILED)
      const taskStatus = status === 'OK' ? 'DISPLAYED' : 'FAILED';
      await dbProvider.query(
        'UPDATE tasks SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2',
        [taskStatus, taskId]
      );

      // Update Tag telemetry
      await dbProvider.query(
        `UPDATE tags SET 
         battery_level = $1, 
         signal_strength = $2, 
         last_seen = NOW(),
         status = $3
         WHERE id = $4`,
        [battery, rssi, 'READY', tagId]
      );

      this.io.emit('task:update', { taskId, status: taskStatus });
      this.io.emit('tag:status', { tagId, battery, rssi, lastSeen: new Date() });
    });
  }
}

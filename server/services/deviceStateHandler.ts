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

    // 1. Handle AP Heartbeats (MessagePack Interpreted)
    mqtt.on('ap:heartbeat', async (data) => {
      const { apId, version, status, targetServer } = data;
      logger.debug({ apId, version }, 'Hardware heartbeat synchronized');

      // Use targetServer.host if available, or fallback
      const ip = targetServer?.host || '0.0.0.0';

      await dbProvider.query(
        `INSERT INTO access_points (id, ip_address, firmware_version, status, last_heartbeat)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET
         ip_address = EXCLUDED.ip_address,
         firmware_version = EXCLUDED.firmware_version,
         status = EXCLUDED.status,
         last_heartbeat = EXCLUDED.last_heartbeat`,
        [apId, ip, version, 'ONLINE'] // Hardware is sending heartbeat, so it's ONLINE
      );

      this.io.emit('ap:status', { apId, status: 'ONLINE', last_heartbeat: new Date() });
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

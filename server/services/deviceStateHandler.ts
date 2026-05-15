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
    mqtt.on('task:result', async (results) => {
      // AP04 Result Payload is an array of updates
      for (const res of results) {
        const { tagId, battery, rssi, status, token } = res;
        logger.info({ tagId, rssi, battery }, 'Hardware feedback processing');

        // Find the most recent task for this tag that is in SENT or ACK state
        const taskRes = await dbProvider.query(
          `SELECT id FROM tasks 
           WHERE target_tag_id = $1 AND status IN ('SENT', 'ACK', 'PENDING')
           ORDER BY updated_at DESC LIMIT 1`,
          [tagId]
        );

        const taskId = taskRes.rows[0]?.id;
        const taskStatus = status === 'OK' ? 'DISPLAYED' : 'FAILED';

        if (taskId) {
          await dbProvider.query(
            'UPDATE tasks SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2',
            [taskStatus, taskId]
          );
          this.io.emit('task:update', { taskId, status: taskStatus });
        }

        // Update Tag telemetry (Schema uses battery_level and rssi)
        await dbProvider.query(
          `UPDATE tags SET 
           battery_level = $1, 
           rssi = $2, 
           last_seen = NOW(),
           status = $3
           WHERE id = $4`,
          [battery, rssi, 'READY', tagId]
        );

        // Record History
        await dbProvider.query(
          `INSERT INTO tag_telemetry_history (tag_id, battery_level, rssi)
           VALUES ($1, $2, $3)`,
          [tagId, battery, rssi]
        );

        this.io.emit('tag:status', { 
          tagId, 
          battery_level: battery, 
          rssi, 
          status: 'READY', 
          lastSeen: new Date() 
        });
      }
    });
  }
}

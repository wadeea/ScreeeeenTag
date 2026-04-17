import msgpack from 'msgpack-lite';
import { logger } from '../lib/logger';

/**
 * ETAG Vendor-Specific Adapter
 * Handles binary translation between OmniESL internal events and 
 * Hardware-specific MessagePack payloads.
 */

export interface EtagAdapterInterface {
  parseHeartbeat(payload: Buffer): { raw: any[]; interpreted: any };
  validateMessage(payload: Buffer): boolean;
}

export class EtagAdapter implements EtagAdapterInterface {
  /**
   * Validates if the buffer has minimal MessagePack structure.
   */
  validateMessage(payload: Buffer): boolean {
    try {
      if (!payload || payload.length === 0) return false;
      const decoded = msgpack.decode(payload);
      return Array.isArray(decoded) && decoded.length >= 11;
    } catch (e) {
      return false;
    }
  }

  /**
   * Decodes and maps the hardware heartbeat.
   * Based on observed data with server-endpoint re-evaluation.
   */
  parseHeartbeat(payload: Buffer) {
    let raw: any[];
    try {
      raw = msgpack.decode(payload);
      if (!Array.isArray(raw)) {
        throw new Error('ETAG payload is not an array');
      }
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to decode MessagePack payload');
      throw err;
    }

    const [host, port] = (raw[4] || '').split(':');

    return {
      raw,
      interpreted: {
        apId: raw[1],
        mac: raw[0],
        status: raw[2],
        hardwareType: raw[3],
        targetServer: {
          host: host || null,
          port: port ? parseInt(port, 10) : null
        },
        credentials: {
          user: raw[5]?.[0] || null,
          pass: raw[5]?.[1] || null
        },
        reportInterval: raw[9],
        version: raw[10],
        networkExtra: raw[6], // Field 6: observed as broadcast or local IP
        rawFields: {
          p7: raw[7],
          p8: raw[8],
          p11: raw[11],
          p12: raw[12]
        }
      }
    };
  }

  /**
   * SKELETON: Task Encoding Logic
   * In Phase 4, this will produce the binary payload required for taskESL topics.
   */
  encodeTask(task: { taskId: string; tagId: string; payload: string }) {
    // Current assumption: The AP acts as a gateway and expects a wrapped command
    // This structure is a placeholder based on standard IoT relay patterns
    const hardwareCommand = [
      task.taskId,
      task.tagId,
      'UPDATE_IMAGE',
      task.payload, // Base64 string from renderer
      Date.now()
    ];

    return msgpack.encode(hardwareCommand);
  }
}

export const etagAdapter = new EtagAdapter();

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
  private processedMessages = new Set<string>();

  validateMessage(payload: Buffer): boolean {
    try {
      if (!payload || payload.length === 0) return false;
      const decoded = msgpack.decode(payload);
      return Array.isArray(decoded);
    } catch (e) {
      return false;
    }
  }

  private isDuplicate(messageId: string): boolean {
    if (this.processedMessages.has(messageId)) return true;
    this.processedMessages.add(messageId);
    if (this.processedMessages.size > 2000) {
      const it = this.processedMessages.values();
      for (let i = 0; i < 500; i++) this.processedMessages.delete(it.next().value);
    }
    return false;
  }

  /**
   * D20 Manual Page 11: Receive eStation heartbeat
   */
  parseHeartbeat(payload: Buffer) {
    let raw: any[];
    try {
      raw = msgpack.decode(payload);
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to decode ETAP04 heartbeat');
      throw err;
    }

    return {
      raw,
      interpreted: {
        apId: raw[0],        // ID
        mac: raw[1],         // MAC
        alias: raw[2],       // Alias
        clientType: raw[3],  // ClientType (Default 2)
        serverAddress: raw[4], // ServerAddress
        params: raw[5],      // Parameters [user, pass]
        ip: raw[6],          // LocalIP
        mask: raw[7],        // SubnetMask
        gateway: raw[8],     // Gateway
        heartbeat: raw[9],   // Heartbeat speed
        version: raw[11],    // AppVersion
        totalTasks: raw[12], // TotalCount in cache
        pendingTasks: raw[13] // SendCount in antenna
      }
    };
  }

  /**
   * D20 Manual Page 12: Publish ESL tasks (TaskESL)
   * Format: [TagID, Pattern, PageIndex, R, G, B, Times, Token, OldKey, NewKey, Base64]
   */
  encodeTask(task: { taskId: string; tagId: string; payload: string }) {
    const hardwareCommand = [
      task.tagId,      // 0: TagID
      0,               // 1: Pattern (0: UpdateDisplay)
      0,               // 2: PageIndex (0: P0)
      false,           // 3: R (LED Red)
      false,           // 4: G (LED Green)
      false,           // 5: B (LED Blue)
      0,               // 6: Times (LED Duration)
      this.generateToken(task.taskId), // 7: Token (Mapping taskId to short int)
      "",              // 8: OldKey (Empty for default)
      "",              // 9: NewKey (Empty)
      task.payload     // 10: Base64String
    ];

    return msgpack.encode(hardwareCommand);
  }

  /**
   * D20 Manual Page 10: Receive eStation result
   */
  decodeResult(payload: Buffer) {
    try {
      const raw = msgpack.decode(payload);
      // Result comes as [AP_ID, TotalCount, SendCount, List<TagResult>]
      const apId = raw[0];
      const tagResults = raw[3] || [];

      return tagResults.map((r: any) => ({
        apId,
        tagId: r[0],
        version: r[1],
        screenCode: r[2],
        rssi: r[3],
        battery: r[4],
        temperature: r[5],
        token: r[6],
        status: 'OK' // Manual page says result channel sends updates for things that happened
      }));
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to decode hardware result');
      throw err;
    }
  }

  private generateToken(taskId: string): number {
    // Generate a 16-bit token from the UUID to track the result back
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
        hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % 65535);
  }
}

export const etagAdapter = new EtagAdapter();

import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import { logger } from '../lib/logger';
import { dbProvider } from './dbProvider';

export class MqttService extends EventEmitter {
  private client: MqttClient | null = null;
  private static instance: MqttService;

  private constructor() {
    super();
    this.init();
  }

  private init() {
    const brokerUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    
    this.client = mqtt.connect(brokerUrl, {
      clientId: `omni_esl_cloud_${Math.random().toString(16).slice(2)}`,
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS,
      protocolVersion: 5,
      clean: false, // Persistent session for reliability
      reconnectPeriod: 2000,
      connectTimeout: 30 * 1000,
      protocol: brokerUrl.startsWith('mqtts') ? 'mqtts' : 'mqtt',
      rejectUnauthorized: false, // In many IoT setups we use self-signed certs initially
      properties: {
        sessionExpiryInterval: 3600 // 1 hour session persistence on broker side
      },
      will: {
        topic: 'omni/cloud/status',
        payload: Buffer.from(JSON.stringify({ status: 'offline', timestamp: Date.now() })),
        qos: 1,
        retain: true
      }
    });

    this.client.on('connect', (connack) => {
      logger.info({ sessionPresent: connack.sessionPresent }, 'Connected to Mosquitto MQTT broker');
      this.subscribeToCoreTopics();
    });

    this.client.on('reconnect', () => {
      logger.warn('MQTT client attempting to reconnect...');
    });

    this.client.on('offline', () => {
      logger.warn('MQTT client is offline');
    });

    this.client.on('message', (topic, payload) => {
      this.handleIncoming(topic, payload.toString());
    });

    this.client.on('error', (err) => {
      logger.error(err, 'MQTT Client Error');
    });
  }

  public static getInstance(): MqttService {
    if (!MqttService.instance) {
      MqttService.instance = new MqttService();
    }
    return MqttService.instance;
  }

  private subscribeToCoreTopics() {
    // Wildcard subscription for AP heartbeats and results
    this.client?.subscribe('/estation/+/heartbeat', { qos: 1 });
    this.client?.subscribe('/estation/+/result', { qos: 1 });
    logger.info('Subscribed to infrastructure topics');
  }

  private handleIncoming(topic: string, message: string) {
    try {
      const parts = topic.split('/');
      const apId = parts[2];
      const type = parts[3];
      const data = JSON.parse(message);

      if (type === 'heartbeat') {
        this.emit('ap:heartbeat', { apId, ...data });
      } else if (type === 'result') {
        this.emit('task:result', { apId, ...data });
      }
    } catch (err) {
      logger.warn({ topic, message }, 'Failed to parse MQTT message');
    }
  }

  public async publish(topic: string, payload: any) {
    return new Promise((resolve, reject) => {
      this.client?.publish(
        topic, 
        JSON.stringify(payload), 
        { qos: 1, retain: false }, 
        (err) => {
          if (err) {
            logger.error({ topic, err }, 'MQTT Publish failure');
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  public async disconnect() {
    if (this.client) {
      logger.info('Disconnecting MQTT client...');
      return new Promise((resolve) => {
        this.client?.end(false, {}, () => {
          logger.info('MQTT client disconnected');
          resolve(true);
        });
      });
    }
  }
}

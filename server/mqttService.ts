import * as aedesModule from 'aedes';
import { createServer } from 'net';
import { EventEmitter } from 'events';

// Handle both CJS and ESM environments for Aedes
const Aedes = (aedesModule as any).default || (aedesModule as any);

export class MqttService extends EventEmitter {
  private broker: any;
  private server: any;
  private static instance: MqttService;

  private constructor() {
    super();
    this.broker = new Aedes();
    this.server = createServer(this.broker.handle);
    
    // MQTT port 1883 for local connections inside container if needed
    // But mostly we use the broker instance directly or via 1883
    this.server.listen(1883, '0.0.0.0', () => {
      console.log('MQTT Broker running on port 1883');
    });

    this.setupHandlers();
  }

  public static getInstance(): MqttService {
    if (!MqttService.instance) {
      MqttService.instance = new MqttService();
    }
    return MqttService.instance;
  }

  private setupHandlers() {
    this.broker.on('client', (client: any) => {
      console.log('MQTT Client Connected:', client.id);
    });

    this.broker.on('publish', (packet: any, client: any) => {
      if (client) {
        const topic = packet.topic;
        const payload = packet.payload.toString();
        
        // Handle heartbeats
        if (topic.includes('/heartbeat')) {
          this.emit('heartbeat', { topic, payload, client: client.id });
        }
        
        // Handle task results
        if (topic.includes('/result')) {
          this.emit('result', { topic, payload, client: client.id });
        }
      }
    });
  }

  public publish(topic: string, message: any) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.broker.publish({
      topic,
      payload,
      cmd: 'publish',
      qos: 1,
      retain: false,
      dup: false
    }, (err: any) => {
      if (err) console.error('MQTT Publish Error:', err);
    });
  }
}

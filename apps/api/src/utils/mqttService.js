import mqtt from 'mqtt';
import config from '../config/config.js';
import DeviceStatus from '../models/DeviceStatus.js';
import wsService from './websocketService.js';

class MqttService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.lastError = null;
    this.lastConnectedAt = null;
    this.lastDisconnectedAt = null;
    this.subscriptions = [];
    this.ackCounters = {
      received: 0,
      applied: 0,
      ignored: 0,
      invalid: 0
    };
  }

  getAckTopicWildcard() {
    const ackPrefix = String(config.MQTT.ACK_TOPIC_PREFIX || 'sproutsense/ack').replace(/\/+$/, '');
    return `${ackPrefix}/+/+/water`;
  }

  async handleAckMessage(topic, payloadBuffer) {
    let data;
    try {
      data = JSON.parse(payloadBuffer.toString('utf8'));
    } catch {
      this.ackCounters.invalid += 1;
      console.warn(`[MQTT] Ignoring non-JSON ack payload on ${topic}`);
      return;
    }

    const topicParts = String(topic).split('/');
    const ownerIdFromTopic = topicParts.length >= 3 ? topicParts[topicParts.length - 3] : null;
    const deviceIdFromTopic = topicParts.length >= 2 ? topicParts[topicParts.length - 2] : null;
    const deviceId = String(data?.deviceId || deviceIdFromTopic || '').toUpperCase();
    const ackStatus = String(data?.status || 'unknown');
    const ackAction = String(data?.action || 'water');
    const correlationId = data?.correlationId ? String(data.correlationId) : null;

    if (!deviceId) {
      this.ackCounters.invalid += 1;
      return;
    }

    if (Object.prototype.hasOwnProperty.call(this.ackCounters, ackStatus)) {
      this.ackCounters[ackStatus] += 1;
    }

    const status = await DeviceStatus.getStatus(deviceId);
    status.transportMode = status.transportMode === 'HTTP' ? 'DUAL' : status.transportMode;
    status.lastCommandTransport = 'MQTT';
    status.lastMqttAckAt = new Date();
    status.lastMqttAckStatus = ackStatus;
    status.lastMqttAckAction = ackAction;
    status.lastMqttAckDetail = data?.detail ? String(data.detail) : null;
    status.lastMqttAckTopic = topic;
    if (correlationId) {
      status.lastMqttCorrelationId = correlationId;
    }
    if (typeof data?.pumpActive === 'boolean') {
      status.pumpActive = data.pumpActive;
      status.currentState = data.pumpActive ? 'WATERING' : 'IDLE';
    }

    await status.save();

    wsService.broadcastDeviceStatusChanged({
      deviceId,
      ownerId: ownerIdFromTopic || null,
      ackStatus,
      ackAction,
      correlationId,
      pumpActive: status.pumpActive,
      currentState: status.currentState,
      lastMqttAckAt: status.lastMqttAckAt
    });
  }

  attachMessageHandler() {
    if (!this.client) {
      return;
    }

    this.client.on('message', async (topic, payloadBuffer) => {
      const ackPrefix = String(config.MQTT.ACK_TOPIC_PREFIX || 'sproutsense/ack').replace(/\/+$/, '') + '/';
      if (!topic.startsWith(ackPrefix)) {
        return;
      }

      try {
        await this.handleAckMessage(topic, payloadBuffer);
      } catch (error) {
        this.lastError = error?.message || String(error);
        console.error('[MQTT] Ack handler error:', this.lastError);
      }
    });
  }

  subscribeAckTopics() {
    if (!this.client || !this.connected) {
      return;
    }

    const wildcardTopic = this.getAckTopicWildcard();
    this.client.subscribe(wildcardTopic, { qos: 1 }, (error) => {
      if (error) {
        this.lastError = error?.message || String(error);
        console.error(`[MQTT] Subscribe failed for topic ${wildcardTopic}:`, this.lastError);
        return;
      }

      if (!this.subscriptions.includes(wildcardTopic)) {
        this.subscriptions.push(wildcardTopic);
      }
      console.log(`[MQTT] Subscribed: ${wildcardTopic}`);
    });
  }

  init() {
    if (!config.MQTT.ENABLED) {
      console.log('[MQTT] Disabled (MQTT_ENABLED=false)');
      return;
    }

    if (!config.MQTT.BROKER_URL) {
      console.warn('[MQTT] Enabled but MQTT_BROKER_URL is missing. MQTT will remain disabled.');
      return;
    }

    const scheme = config.MQTT.USE_TLS ? 'mqtts' : 'mqtt';
    const baseUrl = config.MQTT.BROKER_URL.replace(/^(mqtts?|wss?):\/\//i, '');
    const brokerUrl = `${scheme}://${baseUrl}`;

    this.client = mqtt.connect(brokerUrl, {
      port: config.MQTT.PORT,
      username: config.MQTT.USERNAME || undefined,
      password: config.MQTT.PASSWORD || undefined,
      reconnectPeriod: config.MQTT.RECONNECT_PERIOD_MS,
      connectTimeout: config.MQTT.CONNECT_TIMEOUT_MS,
      clientId: `${config.MQTT.CLIENT_ID_PREFIX}-${process.pid}`,
      clean: true,
      keepalive: 30
    });

    this.client.on('connect', () => {
      this.connected = true;
      this.lastError = null;
      this.lastConnectedAt = new Date();
      console.log(`[MQTT] Connected to ${brokerUrl}:${config.MQTT.PORT}`);
      this.subscribeAckTopics();
    });

    this.client.on('reconnect', () => {
      console.log('[MQTT] Reconnecting...');
    });

    this.client.on('close', () => {
      this.connected = false;
      this.lastDisconnectedAt = new Date();
      console.log('[MQTT] Connection closed');
    });

    this.client.on('error', (error) => {
      this.lastError = error?.message || String(error);
      console.error('[MQTT] Error:', this.lastError);
    });

    this.attachMessageHandler();
  }

  publish(topic, payload, options = {}) {
    if (!this.connected || !this.client) {
      return false;
    }

    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.client.publish(topic, body, options, (error) => {
      if (error) {
        this.lastError = error?.message || String(error);
        console.error(`[MQTT] Publish failed for topic ${topic}:`, this.lastError);
      }
    });

    return true;
  }

  subscribe(topic, options = { qos: 0 }) {
    if (!this.connected || !this.client) {
      return false;
    }

    this.client.subscribe(topic, options, (error) => {
      if (error) {
        this.lastError = error?.message || String(error);
        console.error(`[MQTT] Subscribe failed for topic ${topic}:`, this.lastError);
      }
    });

    return true;
  }

  onMessage(handler) {
    if (!this.client) {
      return;
    }

    this.client.on('message', handler);
  }

  getHealth() {
    return {
      enabled: config.MQTT.ENABLED,
      configured: Boolean(config.MQTT.BROKER_URL),
      connected: this.connected,
      brokerUrl: config.MQTT.BROKER_URL || null,
      port: config.MQTT.PORT,
      useTls: config.MQTT.USE_TLS,
      subscriptions: this.subscriptions,
      acks: this.ackCounters,
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt,
      lastError: this.lastError
    };
  }

  shutdown() {
    if (!this.client) {
      return;
    }

    this.client.end(true, () => {
      console.log('[MQTT] Client disconnected');
    });
    this.connected = false;
  }
}

const mqttService = new MqttService();

export default mqttService;

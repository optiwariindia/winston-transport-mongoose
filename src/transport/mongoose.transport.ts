import Transport from 'winston-transport';
import { Model } from 'mongoose';
import { MongooseTransportOptions } from '../types/index.js';
import { createLogSchema } from '../schema/log.schema.js';

export class MongooseTransport extends Transport {
  private model: Model<any>;
  private queue: any[] = [];
  private batchSize: number;
  private flushInterval: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;

  constructor(options: MongooseTransportOptions) {
    super(options);

    const {
      connection,
      collection = 'logs',
      modelName = 'Log',
      expires,
      batching,
      additionalSchemaFields,
    } = options;

    if (!connection) {
      throw new Error('Mongoose connection is required');
    }

    const schema = createLogSchema(expires, additionalSchemaFields);

    // Check if model already exists to avoid OverwriteModelError
    this.model = connection.models[modelName] 
      ? connection.model(modelName)
      : connection.model(modelName, schema, collection);

    // Ensure indexes are synced (especially for TTL updates)
    this.model.syncIndexes().catch((err) => {
      this.emit('error', new Error(`Failed to sync indexes: ${err.message}`));
    });

    this.batchSize = batching?.batchSize ?? (batching ? 100 : 1);
    this.flushInterval = batching?.flushInterval ?? 5000;

    if (batching) {
      this.setupFlushTimer();
    }
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, timestamp, ...meta } = info;

    const logEntry = {
      ...meta,
      level,
      message,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      meta,
    };

    if (this.batchSize > 1) {
      this.queue.push(logEntry);
      if (this.queue.length >= this.batchSize) {
        this.flush();
      }
    } else {
      this.saveSingle(logEntry);
    }

    callback();
  }

  private async saveSingle(entry: any): Promise<void> {
    try {
      await this.model.create(entry);
    } catch (error) {
      this.emit('error', error);
    }
  }

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isShuttingDown) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await this.model.insertMany(batch, { ordered: false });
    } catch (error) {
      this.emit('error', error);
    }
  }

  async close(): Promise<void> {
    this.isShuttingDown = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

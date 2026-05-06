import { Connection } from 'mongoose';
import Transport from 'winston-transport';

export interface BatchOptions {
  /** Max number of logs to batch before flushing. Defaults to 100. */
  batchSize?: number;
  /** Max time (ms) to wait before flushing logs. Defaults to 5000ms. */
  flushInterval?: number;
}

export interface MongooseTransportOptions extends Transport.TransportStreamOptions {
  /** The Mongoose connection to use. */
  connection: Connection;
  /** The collection name to store logs in. Defaults to 'logs'. */
  collection?: string;
  /** The model name to use. Defaults to 'Log'. */
  modelName?: string;
  /** 
   * The TTL for log documents (e.g., '30d', '7d'). 
   * If provided, an index with `expireAfterSeconds` will be created.
   */
  expires?: string | number;
  /** Batching configuration. If provided, batching is enabled. */
  batching?: BatchOptions;
  /** Custom schema fields to merge into the base schema. */
  additionalSchemaFields?: Record<string, any>;
}

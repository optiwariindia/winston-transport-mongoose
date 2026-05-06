import { Module, Global, Injectable } from '@nestjs/common';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as winston from 'winston';
import { MongooseTransport } from '../src/index.js';

/**
 * Example of a custom Winston Logger Module for NestJS
 */

@Global()
@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017/nestjs_logs')],
  providers: [
    {
      provide: 'LOGGER',
      useFactory: (connection: Connection) => {
        return winston.createLogger({
          transports: [
            new MongooseTransport({
              connection,
              collection: 'nest_logs',
              expires: '30d',
              batching: { batchSize: 100 }
            }),
            new winston.transports.Console()
          ],
        });
      },
      inject: [getConnectionToken()],
    },
  ],
  exports: ['LOGGER'],
})
export class LoggerModule {}

// Usage in a NestJS Service
@Injectable()
export class AppService {
  constructor(@Inject('LOGGER') private readonly logger: winston.Logger) {}

  getHello(): string {
    this.logger.info('Hello from NestJS Service!', { context: 'AppService' });
    return 'Hello World!';
  }
}

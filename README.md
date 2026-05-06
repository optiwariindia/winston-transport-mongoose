# winston-transport-mongoose

A custom [Winston](https://github.com/winstonjs/winston) transport for [Mongoose](https://mongoosejs.com/).

## Features

- **Strict Mongoose Schema**: Store logs using a formal Mongoose model.
- **Native TTL Support**: Automatically handle log expiration using MongoDB's TTL indexes via Mongoose.
- **Batching**: High-performance batch inserts to minimize database overhead.
- **TypeScript**: First-class support for TypeScript.
- **Schema Extension**: Easily add custom fields to your log documents.

## Installation

```bash
npm install winston-transport-mongoose mongoose winston
```

## Usage

```typescript
import mongoose from 'mongoose';
import winston from 'winston';
import { MongooseTransport } from 'winston-transport-mongoose';

const connection = await mongoose.createConnection('mongodb://localhost:27017/myapp').asPromise();

const logger = winston.createLogger({
  transports: [
    new MongooseTransport({
      connection,
      collection: 'logs',
      expires: '30d', // TTL
      batching: {
        batchSize: 100,
        flushInterval: 5000
      }
    })
  ]
});

logger.info('Log message', { meta: 'data' });
```

## Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `connection` | `mongoose.Connection` | **Required** | The Mongoose connection to use. |
| `collection` | `string` | `'logs'` | The name of the collection. |
| `modelName` | `string` | `'Log'` | The name of the Mongoose model. |
| `expires` | `string \| number` | `undefined` | TTL for logs (e.g., `'7d'`, `'1h'`). |
| `batching` | `BatchOptions` | `undefined` | See Batching section. |
| `additionalSchemaFields` | `Record<string, any>` | `{}` | Custom fields to add to the schema. |

## Logging to Multiple Collections

To log different levels to different collections (e.g., errors to an `errors` collection and info to an `info` collection), you can use multiple transport instances combined with a level filter:

```typescript
const levelFilter = (level: string) => winston.format((info) => {
  return info.level === level ? info : false;
})();

const logger = winston.createLogger({
  transports: [
    new MongooseTransport({
      connection,
      collection: 'errors',
      format: winston.format.combine(levelFilter('error'), winston.format.json())
    }),
    new MongooseTransport({
      connection,
      collection: 'info',
      format: winston.format.combine(levelFilter('info'), winston.format.json())
    })
  ]
});
```

### Batching Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `batchSize` | `number` | `100` | Max logs before flushing. |
| `flushInterval` | `number` | `5000` | Max time (ms) before flushing. |

## Compatibility

| winston-transport-mongoose | Node.js | Mongoose | Winston |
| :--- | :--- | :--- | :--- |
| **v1.x.x** | >= 18.0.0 | ^8.0.0 \|\| ^9.0.0 | ^3.0.0 |

## License

MIT

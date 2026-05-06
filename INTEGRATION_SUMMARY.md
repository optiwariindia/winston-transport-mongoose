### Context: Integration of winston-transport-mongoose

**Project Overview:** A custom Winston transport for Mongoose developed to provide strict schema validation, batching, and native TTL support.

**Package Info:**
- **Name:** `winston-transport-mongoose`
- **NPM:** `npm install winston-transport-mongoose mongoose winston`
- **Main Export:** `MongooseTransport`

**Configuration Options:**
- `connection`: (Required) Existing `mongoose.Connection`.
- `collection`: Collection name (default: `'logs'`).
- `modelName`: Model name (default: `'Log'`).
- `expires`: TTL string for log rotation (e.g., `'30d'`, `'1h'`).
- `batching`: `{ batchSize: number, flushInterval: number }` (Recommended for performance).
- `additionalSchemaFields`: Custom fields to map top-level metadata (e.g., `{ service: String }`).

**Usage Snippet:**
```typescript
import { MongooseTransport } from 'winston-transport-mongoose';
import winston from 'winston';

const transport = new MongooseTransport({
  connection: mongoose.connection,
  collection: 'app_logs',
  expires: '30d',
  batching: { batchSize: 50, flushInterval: 5000 },
  additionalSchemaFields: { service: String }
});

const logger = winston.createLogger({ transports: [transport] });
```

**Implementation Notes:**
- Uses `insertMany` for high-performance batching.
- Spreads metadata into top-level fields if they are defined in `additionalSchemaFields`.
- Support graceful shutdown via `transport.close()`.

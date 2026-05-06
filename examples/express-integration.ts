import express from 'express';
import mongoose from 'mongoose';
import winston from 'winston';
import { MongooseTransport } from '../src/index.js';

const app = express();
const port = 3000;

// 1. Setup Mongoose
await mongoose.connect('mongodb://localhost:27017/express_logs');

// 2. Setup Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new MongooseTransport({
      connection: mongoose.connection,
      collection: 'express_http_logs',
      expires: '30d',
      batching: { batchSize: 10 } // Low batch size for faster flushing in this example
    }),
    new winston.transports.Console()
  ],
});

// 3. Logging Middleware
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/error', (req, res) => {
  logger.error('Test Error Log', { path: '/error', userId: '12345' });
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Express example listening at http://localhost:${port}`);
});

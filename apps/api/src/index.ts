import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? '4000');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}
const host = process.env.HOST ?? '0.0.0.0';
const server = createApp().listen(port, host, () => {
  console.log(`API listening at http://localhost:${port}/api/health`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

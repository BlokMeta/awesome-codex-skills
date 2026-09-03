import { createApp } from './bootstrap.js';

const app = await createApp();
const port = Number(process.env['HG_API_PORT'] ?? 4000);
await app.listen({ port, host: '0.0.0.0' });

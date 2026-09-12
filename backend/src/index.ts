import 'dotenv/config';
import { buildServer } from './server';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 IvoireStream API  →  http://${HOST}:${PORT}`);
    console.log(`📋 Health check      →  http://${HOST}:${PORT}/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

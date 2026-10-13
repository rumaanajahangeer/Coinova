import mongoose from 'mongoose';
import cron from 'node-cron';
import app from './app.js';
import { config } from './config.js';
import { checkAlerts } from './services/alertService.js';
import { runSnapshotsForAll } from './services/snapshotService.js';

let memServer = null;
try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
  console.log('MongoDB connected');
} catch (err) {
  if (config.env !== 'production') {
    console.log(`Could not connect to MongoDB at ${config.mongoUri}. Starting in-memory MongoDB...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(memServer.getUri());
    console.log('In-memory MongoDB connected');
  } else {
    throw err;
  }
}

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

// Background job: evaluate price alerts (default every minute).
let alertsRunning = false;
const alertTask = cron.schedule(config.alertCron, async () => {
  if (alertsRunning) return;
  alertsRunning = true;
  try {
    const fired = await checkAlerts();
    if (fired) console.log(`${fired} price alert(s) triggered`);
  } catch (e) {
    console.warn('alert check failed:', e.message);
  } finally {
    alertsRunning = false;
  }
});

// Background job: store portfolio value history (default hourly).
let snapshotsRunning = false;
const snapshotTask = cron.schedule(config.snapshotCron, async () => {
  if (snapshotsRunning) return;
  snapshotsRunning = true;
  try {
    await runSnapshotsForAll();
  } catch (e) {
    console.warn('snapshot job failed:', e.message);
  } finally {
    snapshotsRunning = false;
  }
});

async function shutdown() {
  alertTask.stop();
  snapshotTask.stop();
  server.close();
  await mongoose.disconnect();
  if (memServer) await memServer.stop();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * Wipe all Sprint Hive collections — MANUAL ONLY.
 *
 * Usage (from backend/):
 *   node scripts/wipeDatabase.js
 *
 * Requires MONGO_URI in .env. This is irreversible.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const COLLECTIONS = [
  'users',
  'organizations',
  'projects',
  'tasks',
  'sprints',
  'bugs',
  'comments',
  'notifications',
  'activities',
  'files',
  'labels',
  'invites',
  'counters', // atomic taskNumber/bugNumber sequences
];

async function wipe() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  console.log(`Connecting to ${uri.replace(/\/\/.*@/, '//***@')} ...`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const existing = (await db.listCollections().toArray()).map((c) => c.name);

  console.log('\nCollections present:', existing.join(', ') || '(none)');
  console.log('\nDeleting all documents...\n');

  for (const name of COLLECTIONS) {
    if (!existing.includes(name)) {
      console.log(`  skip  ${name} (does not exist)`);
      continue;
    }
    const result = await db.collection(name).deleteMany({});
    console.log(`  wiped ${name}: ${result.deletedCount} document(s)`);
  }

  // Also wipe any unexpected collections in this DB (except system.*)
  for (const name of existing) {
    if (COLLECTIONS.includes(name) || name.startsWith('system.')) continue;
    const result = await db.collection(name).deleteMany({});
    console.log(`  wiped ${name} (extra): ${result.deletedCount} document(s)`);
  }

  await mongoose.disconnect();
  console.log('\nDone. Database is empty. Restart the app and register a fresh account.\n');
}

wipe().catch((err) => {
  console.error('Wipe failed:', err);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvUri() {
  // try process.env first
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    return process.env.MONGODB_URI.trim();
  }

  // fallback: try to read .env in the same directory above scripts (project Backend root)
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return null;
  const contents = fs.readFileSync(envPath, 'utf8');
  const m = contents.match(/^MONGODB_URI=(.*)$/m);
  return m ? m[1].trim() : null;
}

(async function main() {
  const uri = loadEnvUri();
  if (!uri) {
    console.error('No MONGODB_URI found. Set $env:MONGODB_URI or add MONGODB_URI=... to Backend/.env');
    process.exit(2);
  }

  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // don't set dbName here; mongoose will use the DB from the URI
    });

    const db = mongoose.connection.db;
    const collections = [
      'users',
      'tasks',
      'pendingassignments',
      'comments',
    ];

    for (const name of collections) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (!exists) {
        console.log(`Collection "${name}" does not exist — skipping.`);
        continue;
      }
      const res = await db.collection(name).deleteMany({});
      console.log(`Cleared ${res.deletedCount} documents from "${name}".`);
    }

    await mongoose.disconnect();
    console.log('Database clear complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing DB:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();
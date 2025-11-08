// Backend/scripts/check-db.js
// Prints document counts for core collections so we can verify the DB state.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvUri() {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) return process.env.MONGODB_URI.trim();
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return null;
  const contents = fs.readFileSync(envPath, 'utf8');
  const m = contents.match(/^MONGODB_URI=(.*)$/m);
  return m ? m[1].trim() : null;
}

(async function main(){
  const uri = loadEnvUri();
  if (!uri) { console.error('No MONGODB_URI found in env or Backend/.env'); process.exit(2); }
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const cols = ['users','tasks','pendingassignments','comments'];
    for (const c of cols) {
      const exists = (await db.listCollections({ name: c }).toArray()).length > 0;
      const n = exists ? await db.collection(c).countDocuments() : 0;
      console.log(`${c}: ${n}`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error checking DB:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();

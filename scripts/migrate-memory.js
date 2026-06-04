// scripts/migrate-memory.js — Phase 57 migration
// Reads memory/memory.txt and imports entries into memory.db
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB, insert, stats } from '../memory/memory-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const memFile = path.join(__dirname, '../memory/memory.txt');
const dbPath  = path.join(__dirname, '../memory/memory.db');

if (!fs.existsSync(memFile)) {
  console.log('No memory.txt found — nothing to migrate.');
  process.exit(0);
}

await getDB(dbPath);

const raw = fs.readFileSync(memFile, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

let imported = 0;
let session_id = 'migrated';

for (const line of lines) {
  if (line.startsWith('User: ')) {
    const content = line.slice(6).trim();
    const tokens = Math.ceil(content.length / 4);
    insert({ session_id, role: 'user', content, tokens });
    imported++;
  } else if (line.startsWith('Assistant: ')) {
    const content = line.slice(11).trim();
    const tokens = Math.ceil(content.length / 4);
    insert({ session_id, role: 'assistant', content, tokens });
    imported++;
  }
}

const s = stats();
console.log('Migration complete.');
console.log('Imported:', imported, 'entries');
console.log('DB stats:', s);

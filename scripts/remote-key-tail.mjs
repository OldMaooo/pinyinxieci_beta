#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const EVENTS_FILE = path.join(ROOT, 'storage', 'remote-key-events.jsonl');

function parseArgs(argv) {
  const out = {
    session: '',
    profile: '',
    limit: 30,
    follow: true,
    interval: 1000,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];

    if (key === '--session' && value) {
      out.session = value;
      i += 1;
      continue;
    }
    if (key === '--profile' && value) {
      out.profile = value;
      i += 1;
      continue;
    }
    if (key === '--limit' && value) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) out.limit = Math.floor(n);
      i += 1;
      continue;
    }
    if (key === '--interval' && value) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 99) out.interval = Math.floor(n);
      i += 1;
      continue;
    }
    if (key === '--once') {
      out.follow = false;
      continue;
    }
  }

  return out;
}

function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];

  const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
  if (!raw.trim()) return [];

  const lines = raw.split('\n').filter(Boolean);
  const events = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event && typeof event === 'object') {
        events.push(event);
      }
    } catch {
      // ignore malformed lines
    }
  }

  return events;
}

function filterEvents(events, { session, profile }) {
  return events.filter((event) => {
    if (session && event.session_id !== session) return false;
    if (profile && event.profile_id !== profile) return false;
    return true;
  });
}

function shortAction(action) {
  if (!action) return '-';
  if (action === 'flash_next') return 'NEXT';
  if (action === 'flash_toggle_play') return 'TOGGLE';
  if (action === 'flash_mark_wrong') return 'WRONG';
  return action;
}

function printEvent(event) {
  const id = event.id ?? '-';
  const ts = event.created_at ? new Date(event.created_at).toLocaleTimeString() : '-';
  const sig = event.normalized_signature || '-';
  const action = shortAction(event.mapped_action);
  const session = event.session_id || '-';
  const profile = event.profile_id || '-';
  const evType = event.event_type || '-';

  console.log(`#${id} ${ts} [${evType}] [${action}] session=${session} profile=${profile}`);
  console.log(`  ${sig}`);
}

function printSummary(config) {
  console.log('--- Remote Key Tail ---');
  console.log(`file: ${EVENTS_FILE}`);
  console.log(`session filter: ${config.session || '(none)'}`);
  console.log(`profile filter: ${config.profile || '(none)'}`);
  console.log(`mode: ${config.follow ? 'follow' : 'once'}`);
  console.log('-----------------------');
}

function main() {
  const config = parseArgs(process.argv);
  printSummary(config);

  let lastPrintedId = 0;

  const dumpLatest = () => {
    const events = filterEvents(readEvents(), config);
    const latest = events.slice(-config.limit);

    if (latest.length === 0) {
      console.log('(no matching events)');
      return;
    }

    for (const event of latest) {
      printEvent(event);
      const id = Number(event.id);
      if (Number.isFinite(id)) lastPrintedId = Math.max(lastPrintedId, id);
    }
  };

  dumpLatest();

  if (!config.follow) {
    return;
  }

  setInterval(() => {
    const events = filterEvents(readEvents(), config);
    const fresh = events.filter((event) => {
      const id = Number(event.id);
      return Number.isFinite(id) && id > lastPrintedId;
    });

    for (const event of fresh) {
      printEvent(event);
      const id = Number(event.id);
      if (Number.isFinite(id)) lastPrintedId = Math.max(lastPrintedId, id);
    }
  }, config.interval);
}

main();

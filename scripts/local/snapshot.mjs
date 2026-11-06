// Saves and restores the local database plus uploaded photos as named
// snapshots in .local/snapshots/ (git-ignored).
// Usage (through scripts/local/run.mjs): snapshot.mjs save|restore|list [name]
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import net from "node:net";
import path from "node:path";

import { createClient } from "@libsql/client";

const SNAPSHOTS_ROOT = path.resolve(".local/snapshots");
const DATABASE_FILE = path.resolve(process.env.TURSO_DATABASE_URL.slice("file:".length));
const UPLOADS_DIRECTORY = path.resolve(process.env.UPLOADS_DIR || "uploads");
const NEXT_CACHE_DIRECTORY = path.resolve(".next");
const SNAPSHOT_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;
const SERVER_CHECK_TIMEOUT_MS = 500;

function usage() {
  console.error("Usage: npm run local:snapshot -- save|restore|list [name]");
  process.exit(1);
}

function snapshotPath(name) {
  if (!name || !SNAPSHOT_NAME_PATTERN.test(name)) {
    console.error("Give a snapshot name using letters, digits, '-' or '_'.");
    process.exit(1);
  }
  return path.join(SNAPSHOTS_ROOT, name);
}

/** The dev server keeps the database open and caches data, so restoring under it would corrupt both. */
function isDevServerRunning() {
  const { hostname, port } = new URL(process.env.SITE_URL);
  return new Promise((resolve) => {
    const socket = net.connect({ host: hostname, port: Number(port) || 80, timeout: SERVER_CHECK_TIMEOUT_MS });
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });
}

async function save(name) {
  const target = snapshotPath(name);
  if (existsSync(target)) {
    console.error(`Snapshot "${name}" already exists. Delete .local/snapshots/${name} to overwrite it.`);
    process.exit(1);
  }
  mkdirSync(target, { recursive: true });

  // VACUUM INTO writes a consistent copy even while the dev server is running.
  const client = createClient({ url: `file:${DATABASE_FILE}` });
  try {
    await client.execute(`VACUUM INTO '${path.join(target, "local.db").replaceAll("'", "''")}'`);
  } finally {
    client.close();
  }
  if (existsSync(UPLOADS_DIRECTORY)) cpSync(UPLOADS_DIRECTORY, path.join(target, "uploads"), { recursive: true });
  console.log(`Saved snapshot "${name}" to .local/snapshots/${name}`);
}

async function restore(name) {
  const source = snapshotPath(name);
  if (!existsSync(path.join(source, "local.db"))) {
    console.error(`Snapshot "${name}" not found. Run: npm run local:snapshot -- list`);
    process.exit(1);
  }
  if (await isDevServerRunning()) {
    console.error(`The dev server is running at ${process.env.SITE_URL}. Stop it, then restore again.`);
    process.exit(1);
  }

  for (const suffix of ["", "-shm", "-wal"]) rmSync(`${DATABASE_FILE}${suffix}`, { force: true });
  mkdirSync(path.dirname(DATABASE_FILE), { recursive: true });
  cpSync(path.join(source, "local.db"), DATABASE_FILE);

  rmSync(UPLOADS_DIRECTORY, { recursive: true, force: true });
  if (existsSync(path.join(source, "uploads"))) cpSync(path.join(source, "uploads"), UPLOADS_DIRECTORY, { recursive: true });

  // Next caches public data on disk; without clearing it, old data shows after the restore.
  rmSync(NEXT_CACHE_DIRECTORY, { recursive: true, force: true });
  console.log(`Restored snapshot "${name}". Start the server with: npm run local:dev`);
}

function list() {
  const names = existsSync(SNAPSHOTS_ROOT) ? readdirSync(SNAPSHOTS_ROOT) : [];
  console.log(names.length ? names.join("\n") : "No snapshots yet. Create one: npm run local:snapshot -- save <name>");
}

const [command, name] = process.argv.slice(2);
if (command === "save") await save(name);
else if (command === "restore") await restore(name);
else if (command === "list") list();
else usage();

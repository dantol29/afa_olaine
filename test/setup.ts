// Loaded with `node --import` before any test file, so the environment below is in place before app modules read it.
// Only node: built-ins are imported here; they do not read the app's environment variables.
import { mkdtempSync, rmSync } from "node:fs";
import * as nodeModule from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

type ResolveContext = { conditions: string[] };
type ResolveHook = (
  specifier: string,
  context: ResolveContext,
  nextResolve: (specifier: string, context: ResolveContext) => unknown,
) => unknown;
// The installed @types/node (v20) does not declare registerHooks yet; Node 24, which the project runs on, has it.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };

// Server modules start with `import "server-only"`, which throws unless resolved with the react-server condition, as
// Next does for server code. Running all of Node with --conditions=react-server is not an option: next/navigation
// (imported by src/lib/auth.ts) then loads the server React build and fails. So only this one package gets it.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier !== "server-only") return nextResolve(specifier, context);
    return nextResolve(specifier, { ...context, conditions: [...context.conditions, "react-server"] });
  },
});

// Refuse instead of silently overriding: a remote URL in the shell usually means production credentials were exported.
for (const [name, value] of Object.entries(process.env)) {
  if (/DATABASE_URL|DB_URL/i.test(name) && value && !value.startsWith("file:")) {
    throw new Error(`Tests refuse to run: ${name} is not a file: URL. Unset it and run npm test again.`);
  }
}

// Always the in-memory database, even if a local file URL was exported: tests must never write to a real database.
process.env.TURSO_DATABASE_URL = "file::memory:";
process.env.TURSO_AUTH_TOKEN = "";
process.env.SESSION_SECRET = "test-session-secret";
process.env.SHARED_CALENDAR_SECRET = "test-shared-calendar-secret";
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.CRON_SECRET = "test-cron-secret";
process.env.SITE_URL = "http://localhost:3000";

// Uploads go one level down so tests can also place files just outside the uploads folder; all of it is removed on exit.
const scratchDir = mkdtempSync(path.join(tmpdir(), "afa-test-"));
process.env.UPLOADS_DIR = path.join(scratchDir, "uploads");
process.on("exit", () => rmSync(scratchDir, { recursive: true, force: true }));

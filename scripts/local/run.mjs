// Runs a command with the isolated local environment from .env.local only.
// Refuses to start when any value could reach a production service.
// Usage: node scripts/local/run.mjs [--with-mail-sink] <command> [args...]
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

import { startMailSink } from "./mail-sink.mjs";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const envFile = path.join(projectRoot, ".env.local");
const envTemplate = path.join(import.meta.dirname, "env.local.example");
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
// Next.js also loads these files; any of them could inject a production value.
const CONFLICTING_ENV_FILES = [
  ".env",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
];

function loadLocalEnv() {
  if (!existsSync(envFile)) {
    copyFileSync(envTemplate, envFile);
    console.log("Created .env.local from scripts/local/env.local.example.");
  }
  // File values win over the shell so an exported production variable is ignored.
  return { ...process.env, ...parseEnv(readFileSync(envFile, "utf8")) };
}

function findIsolationProblems(env) {
  const problems = CONFLICTING_ENV_FILES.filter((name) => existsSync(path.join(projectRoot, name))).map(
    (name) => `${name} exists; move it away so only .env.local is used.`,
  );
  if (env.NODE_ENV === "production") problems.push("NODE_ENV must not be production.");
  if (!env.TURSO_DATABASE_URL?.startsWith("file:")) problems.push("TURSO_DATABASE_URL must be a local file: URL.");
  if (env.TURSO_AUTH_TOKEN) problems.push("TURSO_AUTH_TOKEN must be empty.");
  if (env.SHARED_CALENDAR_SECRET) problems.push("SHARED_CALENDAR_SECRET must be empty.");
  if (env.SMTP_HOST && !LOOPBACK_HOSTS.has(env.SMTP_HOST)) problems.push("SMTP_HOST must be empty or a loopback address.");
  try {
    if (!LOOPBACK_HOSTS.has(new URL(env.SITE_URL).hostname)) problems.push("SITE_URL must point to localhost.");
  } catch {
    problems.push("SITE_URL must be a local URL such as http://localhost:3000.");
  }
  return problems;
}

async function main() {
  const args = process.argv.slice(2);
  const withMailSink = args[0] === "--with-mail-sink";
  const [command, ...commandArgs] = withMailSink ? args.slice(1) : args;
  if (!command) throw new Error("Usage: node scripts/local/run.mjs [--with-mail-sink] <command> [args...]");

  const env = loadLocalEnv();
  const problems = findIsolationProblems(env);
  if (problems.length) {
    console.error(`Local environment refused:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
    process.exit(1);
  }

  if (withMailSink && env.SMTP_HOST) {
    await startMailSink({ host: env.SMTP_HOST, port: Number(env.SMTP_PORT) });
  }

  env.PATH = `${path.join(projectRoot, "node_modules", ".bin")}${path.delimiter}${env.PATH}`;
  const child = spawn(command, commandArgs, { cwd: projectRoot, env, stdio: "inherit" });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
  child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

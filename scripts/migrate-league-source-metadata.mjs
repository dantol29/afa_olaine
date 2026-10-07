import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
if (process.argv.includes("--local-only") && !(process.env.TURSO_DATABASE_URL ?? "file:./local.db").startsWith("file:")) throw new Error("Configured database is remote; run this migration during deployment.");
await import("@olaine/database/migrations/add-league-logo.mjs");
await import("@olaine/database/migrations/add-afa-fields.mjs");

import { spawnSync } from "node:child_process";

// Intentionally do not load .env: that database belongs to the application.
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  console.error("Set TEST_DATABASE_URL to a disposable PostgreSQL database. This command applies migrations and creates/deletes test records.");
  process.exit(1);
}
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: databaseUrl,
  SECURITY_TEST_DATABASE_URL: databaseUrl,
  NODE_ENV: "test",
};
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/vitest/vitest.mjs", "run"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

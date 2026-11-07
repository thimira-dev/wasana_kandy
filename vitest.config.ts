import { defineConfig } from "vitest/config";
import path from "path";

// Database suites are opt-in and never inherit the application's database URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.SECURITY_TEST_DATABASE_URL;
if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SECURITY_TEST_DATABASE_URL = testDatabaseUrl;
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

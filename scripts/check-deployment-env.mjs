import "dotenv/config";

// Check the Vercel test deployment before applying migrations or building.
// Report variable names only; never print credential values.
const errors = [];
const requireValue = (name) => {
  const value = process.env[name];
  if (!value?.trim()) errors.push(`${name} is required`);
  return value || "";
};
const secret = requireValue("AUTH_SECRET");
if (secret && (secret.length < 32 || /^(your-|change[_-]?me|wasana-dev-secret)/i.test(secret))) {
  errors.push("AUTH_SECRET must be a random secret of at least 32 characters");
}
const simulationSecret = requireValue("PAYMENT_SIMULATION_SECRET");
if (simulationSecret && simulationSecret.length < 32) errors.push("PAYMENT_SIMULATION_SECRET must contain at least 32 characters");

for (const name of ["APP_URL", "SUPABASE_URL", "DATABASE_URL"]) {
  const value = requireValue(name);
  if (!value) continue;
  try {
    const url = new URL(value);
    if (name === "DATABASE_URL") {
      if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
    } else {
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error();
    }
  } catch {
    errors.push(`${name} must be a valid ${name === "DATABASE_URL" ? "PostgreSQL connection URL" : "HTTPS origin without a path"}`);
  }
}
requireValue("SUPABASE_SERVICE_ROLE_KEY");
requireValue("SUPABASE_STORAGE_BUCKET");
if (process.env.STORAGE_PROVIDER !== "supabase") errors.push("STORAGE_PROVIDER must be supabase on Vercel");
if (process.env.PAYMENT_PROVIDER !== "simulation") errors.push("PAYMENT_PROVIDER must be simulation for this test deployment");
if (process.env.PAYMENT_MODE !== "test") errors.push("PAYMENT_MODE must be test");
if (process.env.PAYMENT_ALLOW_SIMULATION !== "true") errors.push("PAYMENT_ALLOW_SIMULATION must be true for this test deployment");
if (errors.length) {
  console.error(`Deployment configuration needs attention:\n${errors.map(error => `- ${error}`).join("\n")}`);
  process.exit(1);
}
console.log("Test deployment environment checks passed.");

import "server-only";
import type { PaymentProviderName } from "@prisma/client";

/**
 * Payment configuration. The application target is a real gateway when one is
 * later installed (e.g. PayHere). Until then the `simulation` provider drives a
 * built-in gateway replica that records identical attempt/event audit rows.
 */

type ConfiguredProvider = "simulation" | "payhere";

const DATABASE_PROVIDER_NAMES: Record<ConfiguredProvider, PaymentProviderName | null> = {
  simulation: "SIMULATION",
  // Enable a PayHere enum value together with its adapter when that rollout happens.
  payhere: null,
};

export function getPaymentConfig() {
  const provider = (process.env.PAYMENT_PROVIDER || "simulation") as ConfiguredProvider;
  if (!(provider in DATABASE_PROVIDER_NAMES)) {
    throw new Error("Payment provider is unsupported");
  }
  const mode = process.env.PAYMENT_MODE;
  if (mode !== "test" && mode !== "live") throw new Error("Payment configuration is unavailable");
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("Payment configuration is unavailable");
  // This phase permits sandbox checkout only. Live requires a separate reviewed rollout.
  if (mode !== "test") throw new Error("Live payments are not enabled");

  if (provider === "simulation") {
    let simulationSecret = process.env.PAYMENT_SIMULATION_SECRET || "";
    if (!simulationSecret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Payment configuration is unavailable");
      }
      simulationSecret = "sim_dev_only_secret_change_me_0123456789";
    }
    if (simulationSecret.length < 32) throw new Error("Payment configuration is invalid");
    const databaseProviderName = DATABASE_PROVIDER_NAMES.simulation;
    if (!databaseProviderName) throw new Error("Payment provider is unsupported");
    const url = new URL(appUrl);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
        (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
      throw new Error("Application payment URL is invalid");
    }
    return {
      provider,
      mode,
      appUrl: url.origin,
      databaseProviderName,
      simulationSecret,
    } as const;
  }

  // Real gateway providers require explicitly installed adapters and credentials.
  throw new Error("Payment provider is not enabled");
}

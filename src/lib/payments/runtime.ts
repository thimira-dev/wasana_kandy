import "server-only";
import { getPaymentConfig } from "./config";
import { SimulatedPaymentProvider } from "./simulation-provider";
import { PaymentService } from "@/lib/services/payment-service";

export function getPaymentService() {
  const config = getPaymentConfig();
  if (config.provider === "simulation") {
    return new PaymentService(
      new SimulatedPaymentProvider(config.appUrl, config.simulationSecret),
      { mode: config.mode, appUrl: config.appUrl, providerName: config.databaseProviderName },
    );
  }
  // Real gateways install their adapter here when enabled by configuration.
  throw new Error("Payment provider is not enabled");
}

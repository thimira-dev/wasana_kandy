import { SimulatedCheckoutView, SimulatedCheckoutNotice } from "@/components/public/PaymentSimulatedGatewayView";
import { loadSimulatedCheckout, SimulatedGatewayError, SimulatedSettledError } from "@/lib/payments/simulated-gateway";

export const metadata = { title: "Simulated payment | Wasana Bakers", robots: { index: false, follow: false } };

export const revalidate = 0;

export default async function SimulateCheckoutPage({ searchParams }: {
  searchParams: Promise<{ c?: string; t?: string }>;
}) {
  const { c, t } = await searchParams;

  let outcome:
    | { checkoutId: string; token: string; orderNumber: string; orderTotal: string; description: string }
    | { tone: "settled"; orderNumber: string }
    | { tone: "invalid" | "missing"; orderNumber: null };

  try {
    const loaded = await loadSimulatedCheckout({ checkoutId: c, token: t });
    outcome = { ...loaded, checkoutId: c || "", token: t || "" };
  } catch (error) {
    if (error instanceof SimulatedSettledError) {
      outcome = { tone: "settled", orderNumber: error.orderNumber };
    } else if (error instanceof SimulatedGatewayError) {
      outcome = { tone: error.status === 404 ? "missing" : "invalid", orderNumber: null };
    } else {
      console.error("Simulated checkout page could not load the session");
      outcome = { tone: "missing", orderNumber: null };
    }
  }

  if ("tone" in outcome) {
    return <SimulatedCheckoutNotice orderNumber={outcome.orderNumber} tone={outcome.tone} />;
  }
  return <SimulatedCheckoutView checkout={outcome} />;
}

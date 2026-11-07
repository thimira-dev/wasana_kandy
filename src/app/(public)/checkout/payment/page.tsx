import { PaymentStatusView } from "@/components/public/PaymentStatusView";

export const metadata = { title: "Your cake order | Wasana Bakers", robots: { index: false, follow: false } };
export default async function CheckoutPaymentPage({ searchParams }: {
  searchParams: Promise<{ orderNumber?: string; result?: string }>;
}) {
  const { orderNumber, result } = await searchParams;
  return <PaymentStatusView orderNumber={orderNumber || ""} result={result || ""} />;
}

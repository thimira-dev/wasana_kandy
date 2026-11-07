export type ProviderMode = "test" | "live";
export interface CheckoutInput {
  expiresAt?: string;
  amountCents: number;
  reference: string;
  description: string;
  customer: { name: string; email: string; phone: string };
  successUrl: string;
  cancelUrl: string;
}
export interface ProviderCheckout {
  id: string;
  paymentId: string;
  mode: ProviderMode;
  status: string;
  url: string;
  expiresAt: string;
}
export interface PaymentEvent {
  id: string;
  type: string;
  mode: string;
  checkoutId?: string;
  paymentId?: string;
  reference?: string | null;
  amountCents?: number;
  currency?: string;
  paymentMode?: string;
  paymentStatus?: string;
  succeededAt?: string | null;
}
export interface PaymentProvider {
  createCheckout(input: CheckoutInput, idempotencyKey: string): Promise<ProviderCheckout>;
  verifyWebhook(rawBody: string, signature: string | null): PaymentEvent;
}

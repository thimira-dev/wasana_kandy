-- Add SIMULATION as a payment provider. The historical PAYMENTS_LK value is kept
-- so previously recorded attempts/events still decode and the dashboard renders them.
ALTER TYPE "PaymentProviderName" ADD VALUE IF NOT EXISTS 'SIMULATION';

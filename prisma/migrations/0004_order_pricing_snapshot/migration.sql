-- Persist the server-calculated checkout pricing and destination snapshot on each order.
ALTER TABLE "Order"
  ADD COLUMN "subtotal" INTEGER,
  ADD COLUMN "shippingAmount" INTEGER,
  ADD COLUMN "taxAmount" INTEGER,
  ADD COLUMN "taxRateBps" INTEGER,
  ADD COLUMN "taxName" TEXT,
  ADD COLUMN "taxJurisdiction" TEXT,
  ADD COLUMN "taxBreakdown" JSONB,
  ADD COLUMN "shippingZone" TEXT,
  ADD COLUMN "shippingRule" TEXT,
  ADD COLUMN "shippingName" TEXT,
  ADD COLUMN "shippingLine1" TEXT,
  ADD COLUMN "shippingCity" TEXT,
  ADD COLUMN "shippingState" TEXT,
  ADD COLUMN "shippingPostalCode" TEXT,
  ADD COLUMN "shippingCountry" TEXT;

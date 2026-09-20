-- Inventory reservation and stock accounting.
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'RELEASED');

CREATE TABLE "InventoryItem" (
  "productId" TEXT NOT NULL,
  "onHandStock" INTEGER NOT NULL DEFAULT 0,
  "reservedStock" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("productId"),
  CONSTRAINT "InventoryItem_onHandStock_check" CHECK ("onHandStock" >= 0),
  CONSTRAINT "InventoryItem_reservedStock_check" CHECK ("reservedStock" >= 0),
  CONSTRAINT "InventoryItem_reserved_le_onHand_check" CHECK ("reservedStock" <= "onHandStock")
);

CREATE TABLE "InventoryReservation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryReservation_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "InventoryReservation_order_product_key" UNIQUE ("orderId", "productId"),
  CONSTRAINT "InventoryReservation_order_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
  CONSTRAINT "InventoryReservation_product_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryItem"("productId")
);

CREATE INDEX "InventoryReservation_product_status_idx" ON "InventoryReservation"("productId", "status");
CREATE INDEX "InventoryReservation_order_status_idx" ON "InventoryReservation"("orderId", "status");

INSERT INTO "InventoryItem" ("productId", "onHandStock", "reservedStock") VALUES
  ('p1', 10, 0), ('p2', 10, 0), ('p3', 10, 0), ('p4', 10, 0), ('p5', 10, 0),
  ('p6', 10, 0), ('p7', 10, 0), ('p8', 10, 0), ('p9', 10, 0), ('p10', 10, 0)
ON CONFLICT ("productId") DO NOTHING;

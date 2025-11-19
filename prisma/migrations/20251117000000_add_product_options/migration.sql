-- AlterTable: product options
ALTER TABLE "product"
    ADD COLUMN "sizeOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "colorOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable: cart items selections
ALTER TABLE "cart_item"
    ADD COLUMN "selectedSize" TEXT,
    ADD COLUMN "selectedColor" TEXT;

-- AlterTable: wishlist items selections
ALTER TABLE "wishlist_item"
    ADD COLUMN "selectedSize" TEXT,
    ADD COLUMN "selectedColor" TEXT;

-- AlterTable: order items selections
ALTER TABLE "order_item"
    ADD COLUMN "selectedSize" TEXT,
    ADD COLUMN "selectedColor" TEXT;

-- Update unique constraints to respect selections
DROP INDEX IF EXISTS "cart_item_cartId_productId_key";
CREATE UNIQUE INDEX "cart_item_cartId_productId_selectedSize_selectedColor_key"
    ON "cart_item"("cartId", "productId", "selectedSize", "selectedColor");

DROP INDEX IF EXISTS "wishlist_item_wishlistId_productId_key";
CREATE UNIQUE INDEX "wishlist_item_wishlistId_productId_selectedSize_selectedColor_key"
    ON "wishlist_item"("wishlistId", "productId", "selectedSize", "selectedColor");

DROP INDEX IF EXISTS "order_item_orderId_productId_key";
CREATE UNIQUE INDEX "order_item_orderId_productId_selectedSize_selectedColor_key"
    ON "order_item"("orderId", "productId", "selectedSize", "selectedColor");

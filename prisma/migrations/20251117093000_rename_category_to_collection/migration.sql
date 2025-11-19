-- Rename legacy category tables to collection equivalents if they still exist
DO $$
BEGIN
  IF to_regclass('public.category') IS NOT NULL AND to_regclass('public.collection') IS NULL THEN
    ALTER TABLE "category" RENAME TO "collection";
  END IF;
END $$;

-- Ensure unique index uses new name
DO $$
BEGIN
  IF to_regclass('public.collection') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'category_slug_key'
  ) THEN
    ALTER INDEX "category_slug_key" RENAME TO "collection_slug_key";
  END IF;
END $$;

-- Refresh parent foreign key constraint if it still carries the old name
DO $$
BEGIN
  IF to_regclass('public.collection') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'category_parentId_fkey'
    ) THEN
      ALTER TABLE "collection" DROP CONSTRAINT "category_parentId_fkey";
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'collection_parentId_fkey'
    ) THEN
      ALTER TABLE "collection"
        ADD CONSTRAINT "collection_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Rename join table and its columns/constraints to match Prisma schema
DO $$
BEGIN
  IF to_regclass('public.product_category') IS NOT NULL AND to_regclass('public.product_collection') IS NULL THEN
    ALTER TABLE "product_category" RENAME TO "product_collection";
  END IF;
END $$;

-- Rename column categoryId -> collectionId if necessary
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_collection' AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE "product_collection" RENAME COLUMN "categoryId" TO "collectionId";
  END IF;
END $$;

-- Recreate primary key/foreign keys with updated names
DO $$
BEGIN
  IF to_regclass('public.product_collection') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'product_category_pkey'
    ) THEN
      ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_pkey";
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'product_collection_pkey'
    ) THEN
      ALTER TABLE "product_collection"
        ADD CONSTRAINT "product_collection_pkey"
        PRIMARY KEY ("productId", "collectionId");
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'product_category_productId_fkey'
    ) THEN
      ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_productId_fkey";
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'product_category_categoryId_fkey'
    ) THEN
      ALTER TABLE "product_collection" DROP CONSTRAINT "product_category_categoryId_fkey";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'product_collection_productId_fkey'
    ) THEN
      ALTER TABLE "product_collection"
        ADD CONSTRAINT "product_collection_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'product_collection_collectionId_fkey'
    ) THEN
      ALTER TABLE "product_collection"
        ADD CONSTRAINT "product_collection_collectionId_fkey"
        FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

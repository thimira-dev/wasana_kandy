-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "collections_code_key" ON "collections"("code");

-- CreateIndex
CREATE INDEX "collections_isActive_idx" ON "collections"("isActive");

-- Backfill: seed one Category row per distinct mainCategory already in use on products.
-- Product.mainCategory semantics stay a plain string (same pattern as order snapshots),
-- so existing cakes remain assigned to their category by name.
INSERT INTO "categories" ("id", "name", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT
    concat('cat_', lower(replace(gen_random_uuid()::text, '-', ''))),
    t."mainCategory",
    (row_number() OVER (ORDER BY t."mainCategory") - 1)::int,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "mainCategory"
    FROM "products"
    WHERE "mainCategory" IS NOT NULL AND length(trim("mainCategory")) > 0
) t;

-- Backfill: seed the known Wasana physical-catalogue collections.
INSERT INTO "collections" ("id", "code", "name", "isSeasonal", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'G',   'G Collection',              false, 0,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'M',   'Mini Cake',                 false, 1,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'N',   'N Collection',              false, 2,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'S',   'Wasana Special',            false, 3,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'ND',  'New Design Mini Cake',      false, 4,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'P',   'Parchment',                 false, 5,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'E',   'Edible Printed Photo Cake', false, 6,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'GU',  'Special Icing Cake',        false, 7,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'NC',  'Cherry Cake',               false, 8,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'NY',  'New Year Special',          true,  9,  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'X',   'Christmas Special',         true,  10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'C',   'Cup Cakes',                 false, 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'NYC', 'New Year Cup Cakes',        true,  12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (concat('col_', lower(replace(gen_random_uuid()::text, '-', ''))), 'PC',  'PC Collection',             false, 13, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

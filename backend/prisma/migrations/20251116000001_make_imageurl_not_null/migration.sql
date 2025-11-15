-- AlterTable: Make imageUrl NOT NULL to match Prisma schema
-- First, update any NULL values to a default (if any exist)
UPDATE "Post" SET "imageUrl" = 'https://picsum.photos/500/700' WHERE "imageUrl" IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE "Post" ALTER COLUMN "imageUrl" SET NOT NULL;


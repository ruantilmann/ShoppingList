/*
  Warnings:

  - You are about to drop the column `unit` on the `shopping_item` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('KG', 'ML', 'UN');

-- AlterTable
ALTER TABLE "shopping_item" DROP COLUMN "unit",
ADD COLUMN     "unitOfMeasure" "UnitOfMeasure" NOT NULL DEFAULT 'UN';

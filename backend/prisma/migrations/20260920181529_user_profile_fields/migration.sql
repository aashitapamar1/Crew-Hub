/*
  Warnings:

  - You are about to drop the column `fullName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Freelancer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Freelancer` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `Freelancer` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "fullName",
DROP COLUMN "phone",
DROP COLUMN "profilePicture";

-- AlterTable
ALTER TABLE "Freelancer" DROP COLUMN "fullName",
DROP COLUMN "phone",
DROP COLUMN "profilePicture";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profilePicture" TEXT;

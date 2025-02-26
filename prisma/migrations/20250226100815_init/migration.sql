/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `organizationId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropIndex
DROP INDEX "Organization_name_key";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image",
DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'documents',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamInfo" JSONB,
    "clientInfo" JSONB,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_projectId_key" ON "KnowledgeBase"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

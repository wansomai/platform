-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "aiAssociateId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeOrganizationId" TEXT,
ALTER COLUMN "role" SET DEFAULT 'member';

-- CreateTable
CREATE TABLE "UserOrganization" (
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrganization_pkey" PRIMARY KEY ("userId","organizationId")
);

-- CreateTable
CREATE TABLE "AIAssociate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAssociate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociateStep" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,

    CONSTRAINT "AssociateStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociateTool" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,

    CONSTRAINT "AssociateTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAssociate" (
    "associateId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssociate_pkey" PRIMARY KEY ("associateId","projectId")
);

-- CreateIndex
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeOrganizationId_fkey" FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_aiAssociateId_fkey" FOREIGN KEY ("aiAssociateId") REFERENCES "AIAssociate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssociate" ADD CONSTRAINT "AIAssociate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssociate" ADD CONSTRAINT "AIAssociate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociateStep" ADD CONSTRAINT "AssociateStep_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "AIAssociate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociateTool" ADD CONSTRAINT "AssociateTool_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "AIAssociate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssociate" ADD CONSTRAINT "ProjectAssociate_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "AIAssociate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssociate" ADD CONSTRAINT "ProjectAssociate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

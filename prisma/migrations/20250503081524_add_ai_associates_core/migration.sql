-- CreateTable
CREATE TABLE "SharedMessage" (
    "id" TEXT NOT NULL,
    "sharedWorkspaceId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "userName" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedMessageReference" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "page" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedMessageReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedWorkspace" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "accessMode" TEXT NOT NULL DEFAULT 'read_only',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "passcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedWorkspaceAccess" (
    "id" TEXT NOT NULL,
    "sharedWorkspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT NOT NULL,
    "accessTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedWorkspaceAccess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedMessage" ADD CONSTRAINT "SharedMessage_sharedWorkspaceId_fkey" FOREIGN KEY ("sharedWorkspaceId") REFERENCES "SharedWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMessage" ADD CONSTRAINT "SharedMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMessageReference" ADD CONSTRAINT "SharedMessageReference_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMessageReference" ADD CONSTRAINT "SharedMessageReference_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SharedMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWorkspace" ADD CONSTRAINT "SharedWorkspace_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWorkspace" ADD CONSTRAINT "SharedWorkspace_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWorkspace" ADD CONSTRAINT "SharedWorkspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWorkspaceAccess" ADD CONSTRAINT "SharedWorkspaceAccess_sharedWorkspaceId_fkey" FOREIGN KEY ("sharedWorkspaceId") REFERENCES "SharedWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWorkspaceAccess" ADD CONSTRAINT "SharedWorkspaceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

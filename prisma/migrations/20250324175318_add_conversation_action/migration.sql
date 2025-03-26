-- CreateTable
CREATE TABLE "ConversationAction" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultContent" TEXT,
    "resultUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConversationAction" ADD CONSTRAINT "ConversationAction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationAction" ADD CONSTRAINT "ConversationAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

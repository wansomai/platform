-- CreateTable
CREATE TABLE "ConversationMeta" (
    "conversationId" TEXT NOT NULL,
    "instructions" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationMeta_pkey" PRIMARY KEY ("conversationId")
);

-- AddForeignKey
ALTER TABLE "ConversationMeta" ADD CONSTRAINT "ConversationMeta_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

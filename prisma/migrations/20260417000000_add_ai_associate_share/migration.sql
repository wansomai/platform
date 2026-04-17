-- Migration: AI Associates become user-level. Introduce AIAssociateShare to
-- explicitly grant other organization members access to a specific associate.
-- By default, an associate is only visible to its creator.

CREATE TABLE IF NOT EXISTS "AIAssociateShare" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAssociateShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIAssociateShare_associateId_userId_key"
    ON "AIAssociateShare"("associateId", "userId");

CREATE INDEX IF NOT EXISTS "idx_associate_share_associate"
    ON "AIAssociateShare"("associateId");

CREATE INDEX IF NOT EXISTS "idx_associate_share_user"
    ON "AIAssociateShare"("userId");

ALTER TABLE "AIAssociateShare"
    ADD CONSTRAINT "AIAssociateShare_associateId_fkey"
    FOREIGN KEY ("associateId") REFERENCES "AIAssociate"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIAssociateShare"
    ADD CONSTRAINT "AIAssociateShare_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIAssociateShare"
    ADD CONSTRAINT "AIAssociateShare_grantedById_fkey"
    FOREIGN KEY ("grantedById") REFERENCES "User"("id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

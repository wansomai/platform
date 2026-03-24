-- Migration: Fix workspace visibility defaults for old workspaces
-- Adds the visibility column if missing, then resets every workspace that was
-- created with the old 'organization' default back to 'restricted' (personal /
-- creator-only).  The member-role ProjectMember rows that were auto-added when
-- visibility was 'organization' are also removed so those users lose the
-- previously inherited access.

-- Add column if it was never migrated (safe no-op if it already exists)
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'restricted';

-- Backfill NULL values (column existed but was nullable in some environments)
UPDATE "Project" SET "visibility" = 'restricted' WHERE "visibility" IS NULL;

-- Reset ALL workspaces currently set to 'organization' back to 'restricted', and
-- in the same transaction atomically delete the member-role ProjectMember rows
-- that were auto-created when those workspaces inherited the old default.
-- Admin-role rows (workspace creators) are intentionally kept.
WITH reset_projects AS (
  UPDATE "Project"
  SET "visibility" = 'restricted'
  WHERE "visibility" = 'organization'
  RETURNING "id"
)
DELETE FROM "ProjectMember"
WHERE "role" = 'member'
  AND "projectId" IN (SELECT "id" FROM reset_projects);

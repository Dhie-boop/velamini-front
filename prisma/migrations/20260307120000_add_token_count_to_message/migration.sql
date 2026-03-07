-- Add tokenCount column to Message for per-message AI token tracking
ALTER TABLE "Message" ADD COLUMN "tokenCount" INTEGER;

-- Add agent configuration and API key fields to Organization
ALTER TABLE "Organization" ADD COLUMN "agentName" TEXT;
ALTER TABLE "Organization" ADD COLUMN "agentPersonality" TEXT;
ALTER TABLE "Organization" ADD COLUMN "apiKey" TEXT;
CREATE UNIQUE INDEX "Organization_apiKey_key" ON "Organization"("apiKey");

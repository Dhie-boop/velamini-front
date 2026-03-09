-- AddFeedbackUserIdAndSlug
ALTER TABLE "Feedback" ADD COLUMN "userId" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "virtualSelfSlug" TEXT;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

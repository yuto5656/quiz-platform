-- Add questionId to Comment for question-level discussions
ALTER TABLE "Comment" ADD COLUMN "questionId" TEXT;

-- Create index for questionId
CREATE INDEX "Comment_questionId_idx" ON "Comment"("questionId");

-- Add foreign key for Comment -> Question
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

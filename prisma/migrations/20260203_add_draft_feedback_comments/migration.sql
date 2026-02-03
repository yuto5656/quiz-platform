-- Add status field to Quiz for draft support
ALTER TABLE "Quiz" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "Quiz" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Make categoryId nullable for drafts
ALTER TABLE "Quiz" ALTER COLUMN "categoryId" DROP NOT NULL;

-- Set publishedAt for existing published quizzes
UPDATE "Quiz" SET "publishedAt" = "createdAt" WHERE "status" = 'published';

-- Create index for status
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

-- Create Feedback table
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- Create Feedback indexes
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");
CREATE INDEX "Feedback_category_idx" ON "Feedback"("category");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt" DESC);

-- Add foreign key for Feedback
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Comment table
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Create Comment indexes
CREATE INDEX "Comment_quizId_idx" ON "Comment"("quizId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt" DESC);

-- Add foreign keys for Comment
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

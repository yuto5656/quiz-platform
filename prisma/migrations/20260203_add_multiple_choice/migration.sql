-- Add isMultipleChoice column to Question
ALTER TABLE "Question" ADD COLUMN "isMultipleChoice" BOOLEAN NOT NULL DEFAULT false;

-- Add correctIndices column with default value converted from correctIndex
ALTER TABLE "Question" ADD COLUMN "correctIndices" JSONB;
UPDATE "Question" SET "correctIndices" = json_build_array("correctIndex");
ALTER TABLE "Question" ALTER COLUMN "correctIndices" SET NOT NULL;

-- Drop old correctIndex column
ALTER TABLE "Question" DROP COLUMN "correctIndex";

-- Add selectedIndices column to AnswerHistory with default value converted from selectedIndex
ALTER TABLE "AnswerHistory" ADD COLUMN "selectedIndices" JSONB;
UPDATE "AnswerHistory" SET "selectedIndices" = json_build_array("selectedIndex");
ALTER TABLE "AnswerHistory" ALTER COLUMN "selectedIndices" SET NOT NULL;

-- Drop old selectedIndex column
ALTER TABLE "AnswerHistory" DROP COLUMN "selectedIndex";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "classificationConfidence" DOUBLE PRECISION,
ADD COLUMN     "classifiedAt" TIMESTAMP(3),
ADD COLUMN     "featureArea" TEXT;

-- CreateIndex
CREATE INDEX "Feedback_workspaceId_classifiedAt_idx" ON "Feedback"("workspaceId", "classifiedAt");

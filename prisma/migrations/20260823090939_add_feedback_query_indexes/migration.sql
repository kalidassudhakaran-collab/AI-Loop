-- CreateIndex
CREATE INDEX "Feedback_workspaceId_channel_idx" ON "Feedback"("workspaceId", "channel");

-- CreateIndex
CREATE INDEX "Feedback_workspaceId_sentiment_idx" ON "Feedback"("workspaceId", "sentiment");

-- CreateIndex
CREATE INDEX "Feedback_workspaceId_channel_status_idx" ON "Feedback"("workspaceId", "channel", "status");

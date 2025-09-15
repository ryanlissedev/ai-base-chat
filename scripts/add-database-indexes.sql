-- Database Indexes for Performance Optimization
-- Run this script to add missing indexes identified in the refactoring analysis

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email ON "User" ("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_at ON "User" ("createdAt");

-- Chat table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_user_id ON "Chat" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_updated_at ON "Chat" ("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_visibility ON "Chat" ("visibility");

-- Message table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_id ON "Message" ("chatId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_created_at ON "Message" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_id_created_at ON "Message" ("chatId", "createdAt");

-- Document table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_user_id ON "Document" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_message_id ON "Document" ("messageId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_created_at ON "Document" ("createdAt");

-- Vote table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_chat_id ON "Vote" ("chatId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_message_id ON "Vote" ("messageId");

-- Suggestion table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_user_id ON "Suggestion" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_document_id ON "Suggestion" ("documentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_created_at ON "Suggestion" ("createdAt");

-- Analyze tables after adding indexes
ANALYZE "User";
ANALYZE "Chat";
ANALYZE "Message";
ANALYZE "Document";
ANALYZE "Vote";
ANALYZE "Suggestion";


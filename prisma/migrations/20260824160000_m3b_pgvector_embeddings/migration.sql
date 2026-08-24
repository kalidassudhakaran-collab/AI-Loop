-- Enable pgvector (requires pgvector-enabled Postgres image, e.g. pgvector/pgvector:pg16)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- AlterTable: replace Float[] placeholder with real vector + status metadata
-- HNSW requires a fixed dimension. nomic-embed-text uses 768 dimensions.
ALTER TABLE "Embedding" DROP COLUMN IF EXISTS "vector";

ALTER TABLE "Embedding"
ADD COLUMN "dimensions" INTEGER,
ADD COLUMN "provider" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "status" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "error" TEXT,
ADD COLUMN "vector" vector(768),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Cosine similarity HNSW index (requires vector(N), not undimensioned vector)
CREATE INDEX IF NOT EXISTS "Embedding_vector_hnsw_idx"
ON "Embedding"
USING hnsw ("vector" vector_cosine_ops);

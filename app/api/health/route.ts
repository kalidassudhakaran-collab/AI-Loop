import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public deploy check — no secrets returned.
 * Open /api/health on Vercel to verify DB + auth env are wired.
 */
export async function GET() {
  let db = false;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message.slice(0, 160) : "db_error";
  }

  return NextResponse.json({
    ok: db,
    db,
    dbError,
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
    nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
    embeddingProvider: process.env.EMBEDDING_PROVIDER ?? null,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
}

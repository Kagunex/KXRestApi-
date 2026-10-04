import { NextRequest } from "next/server";
import {
  getAnimeBySlug,
  UpstreamError,
  NotFoundError,
} from "@/services/samehadaku";
import { successResponse, errorResponse } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return errorResponse(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429
    );
  }

  const { slug } = await params;

  if (!slug || !slug.trim()) {
    return errorResponse("INVALID_SLUG", "Anime slug is required", 400);
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const anime = await getAnimeBySlug(cleanSlug);
    return successResponse(anime);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse("NOT_FOUND", err.message, 404);
    }
    if (err instanceof UpstreamError) {
      return errorResponse("UPSTREAM_ERROR", err.message, err.status);
    }
    console.error("[anime]", err);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      500
    );
  }
}

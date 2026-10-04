import { NextRequest } from "next/server";
import { getGenres, UpstreamError } from "@/services/samehadaku";
import { listResponse, errorResponse } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return errorResponse(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429
    );
  }

  try {
    const genres = await getGenres();
    return listResponse(genres);
  } catch (err) {
    if (err instanceof UpstreamError) {
      return errorResponse("UPSTREAM_ERROR", err.message, err.status);
    }
    console.error("[genres]", err);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      500
    );
  }
}

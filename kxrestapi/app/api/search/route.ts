import { NextRequest } from "next/server";
import { searchAnime, UpstreamError } from "@/services/samehadaku";
import { listResponse, errorResponse } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/cache";

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 100;

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

  const q = request.nextUrl.searchParams.get("q");

  if (q === null || q === undefined) {
    return errorResponse(
      "INVALID_QUERY",
      "Query parameter q is required",
      400
    );
  }

  const query = q.trim();

  if (!query) {
    return errorResponse(
      "INVALID_QUERY",
      "Query parameter q cannot be empty",
      400
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return errorResponse(
      "INVALID_QUERY",
      `Query must be at most ${MAX_QUERY_LENGTH} characters`,
      400
    );
  }

  try {
    const results = await searchAnime(query);
    return listResponse(results, { query });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return errorResponse("UPSTREAM_ERROR", err.message, err.status);
    }
    console.error("[search]", err);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      500
    );
  }
}

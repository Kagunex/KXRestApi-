import { NextRequest } from "next/server";
import { startRequest, handleServiceError } from "@/lib/api-handler";
import { jsonList, jsonError } from "@/lib/response";
import { validateQuery, parsePositiveInt } from "@/lib/validation";
import { searchAnime } from "@/services/samehadaku";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { requestId, elapsed, rate } = startRequest(request);

  if (!rate.allowed) {
    return jsonError(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429,
      requestId,
      elapsed()
    );
  }

  const q = request.nextUrl.searchParams.get("q");
  const validation = validateQuery(q);
  if (!validation.ok) {
    return jsonError(
      "INVALID_REQUEST",
      validation.message,
      400,
      requestId,
      elapsed()
    );
  }

  const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1, 100);
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20, 50);

  try {
    const { results, pagination } = await searchAnime(validation.query, page, limit);
    return jsonList(results, {
      requestId,
      responseTime: elapsed(),
      pagination,
      extras: { query: validation.query },
    });
  } catch (err) {
    return handleServiceError(err, requestId, elapsed());
  }
}

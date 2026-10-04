import { NextRequest } from "next/server";
import { startRequest, handleServiceError } from "@/lib/api-handler";
import { jsonList, jsonError } from "@/lib/response";
import { validateSlug, parsePositiveInt } from "@/lib/validation";
import { getAnimeByGenre } from "@/services/samehadaku";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { requestId, elapsed, rate } = startRequest(request);

  if (!rate.allowed) {
    return jsonError("RATE_LIMITED", "Too many requests. Please try again later.", 429, requestId, elapsed());
  }

  const { slug: raw } = await params;
  const validation = validateSlug(raw);
  if (!validation.ok) {
    return jsonError("INVALID_REQUEST", validation.message, 400, requestId, elapsed());
  }

  const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1, 100);
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20, 50);

  try {
    const { results, pagination } = await getAnimeByGenre(validation.slug, page, limit);
    return jsonList(results, {
      requestId,
      responseTime: elapsed(),
      pagination,
      extras: { genre: validation.slug },
    });
  } catch (err) {
    return handleServiceError(err, requestId, elapsed());
  }
}

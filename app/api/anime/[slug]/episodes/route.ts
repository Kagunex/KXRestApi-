import { NextRequest } from "next/server";
import { startRequest, handleServiceError } from "@/lib/api-handler";
import { jsonList, jsonError } from "@/lib/response";
import { validateSlug, parsePositiveInt } from "@/lib/validation";
import { getAnimeEpisodes } from "@/services/samehadaku";

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
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 50, 100);

  try {
    const { anime, episodes, total } = await getAnimeEpisodes(validation.slug, page, limit);
    return jsonList(episodes, {
      requestId,
      responseTime: elapsed(),
      pagination: {
        page,
        limit,
        total,
        hasNext: page * limit < total,
      },
      extras: { anime },
    });
  } catch (err) {
    return handleServiceError(err, requestId, elapsed());
  }
}

import { NextRequest } from "next/server";
import { startRequest, handleServiceError } from "@/lib/api-handler";
import { jsonSuccess, jsonError } from "@/lib/response";
import { validateSlug } from "@/lib/validation";
import { getAnimeBySlug } from "@/services/samehadaku";

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

  try {
    const anime = await getAnimeBySlug(validation.slug);
    return jsonSuccess(anime, { requestId, responseTime: elapsed() });
  } catch (err) {
    return handleServiceError(err, requestId, elapsed());
  }
}

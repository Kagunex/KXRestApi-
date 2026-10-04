import { NextRequest } from "next/server";
import { startRequest, handleServiceError } from "@/lib/api-handler";
import { jsonSuccess, jsonError } from "@/lib/response";
import { getEpisodeById } from "@/services/samehadaku";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { requestId, elapsed, rate } = startRequest(request);

  if (!rate.allowed) {
    return jsonError("RATE_LIMITED", "Too many requests. Please try again later.", 429, requestId, elapsed());
  }

  const { id } = await params;
  if (!id || !id.trim()) {
    return jsonError("INVALID_REQUEST", "Episode id is required", 400, requestId, elapsed());
  }

  const clean = id.trim().toLowerCase();
  if (clean.length > 200 || !/^[a-z0-9][a-z0-9\-]*$/.test(clean)) {
    return jsonError("INVALID_REQUEST", "Invalid episode id format", 400, requestId, elapsed());
  }

  try {
    const episode = await getEpisodeById(clean);
    return jsonSuccess(episode, { requestId, responseTime: elapsed() });
  } catch (err) {
    return handleServiceError(err, requestId, elapsed());
  }
}

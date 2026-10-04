import { NextRequest } from "next/server";
import { startRequest, handleServiceError } from "@/lib/api-handler";
import { jsonList, jsonError } from "@/lib/response";
import { getGenres } from "@/services/samehadaku";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { requestId, elapsed, rate } = startRequest(request);

  if (!rate.allowed) {
    return jsonError("RATE_LIMITED", "Too many requests. Please try again later.", 429, requestId, elapsed());
  }

  try {
    const genres = await getGenres();
    return jsonList(genres, { requestId, responseTime: elapsed() });
  } catch (err) {
    return handleServiceError(err, requestId, elapsed());
  }
}

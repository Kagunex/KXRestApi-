import { NextRequest } from "next/server";
import { startRequest } from "@/lib/api-handler";
import { jsonList, jsonError } from "@/lib/response";

export const dynamic = "force-dynamic";

/**
 * Schedule endpoint.
 * Samehadaku homepage does not expose a structured schedule page
 * that can be reliably parsed without fabricating data.
 * Returns an empty list with a note rather than fake data.
 */
export async function GET(request: NextRequest) {
  const { requestId, elapsed, rate } = startRequest(request);

  if (!rate.allowed) {
    return jsonError("RATE_LIMITED", "Too many requests. Please try again later.", 429, requestId, elapsed());
  }

  return jsonList([], {
    requestId,
    responseTime: elapsed(),
    extras: {
      note: "Schedule data is not available from the current source adapter.",
    },
  });
}

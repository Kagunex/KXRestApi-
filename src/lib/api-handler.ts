import { NextRequest } from "next/server";
import { resolveRequestId } from "./request-id";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { jsonError } from "./response";
import {
  SourceError,
  SourceUnavailableError,
  NotFoundError,
} from "@/services/samehadaku";

export function startRequest(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const start = Date.now();
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);

  return {
    requestId,
    start,
    elapsed: () => Date.now() - start,
    rate,
  };
}

export function handleServiceError(
  err: unknown,
  requestId: string,
  responseTime: number
) {
  if (err instanceof NotFoundError) {
    return jsonError("NOT_FOUND", err.message, 404, requestId, responseTime);
  }
  if (err instanceof SourceUnavailableError) {
    return jsonError(
      "SOURCE_UNAVAILABLE",
      err.message,
      503,
      requestId,
      responseTime
    );
  }
  if (err instanceof SourceError) {
    return jsonError(
      "SOURCE_ERROR",
      err.message,
      err.status,
      requestId,
      responseTime
    );
  }
  console.error("[kxrestapi]", err);
  return jsonError(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    500,
    requestId,
    responseTime
  );
}

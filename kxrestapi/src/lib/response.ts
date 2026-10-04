import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/types/anime";

export function successResponse<T>(
  data: T,
  extras: Record<string, unknown> = {},
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...extras,
      ...(typeof data === "object" && data !== null && !Array.isArray(data)
        ? { data }
        : { data }),
    },
    { status }
  );
}

export function listResponse<T>(
  items: T[],
  extras: Record<string, unknown> = {},
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      count: items.length,
      ...extras,
      data: items,
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status: number
) {
  const body: { success: false; error: ApiErrorBody } = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status });
}

export function withResponseTime(
  start: number,
  payload: Record<string, unknown>,
  status = 200
) {
  const responseTime = Date.now() - start;
  return NextResponse.json(
    {
      ...payload,
      responseTime,
    },
    { status }
  );
}

import { NextResponse } from "next/server";
import type { ApiErrorBody, ErrorCode, Pagination } from "@/types/anime";

export function jsonSuccess<T>(
  data: T,
  opts: {
    status?: number;
    requestId: string;
    responseTime: number;
    extras?: Record<string, unknown>;
  }
) {
  const body = {
    success: true as const,
    ...opts.extras,
    data,
  };
  return NextResponse.json(body, {
    status: opts.status ?? 200,
    headers: {
      "X-Request-Id": opts.requestId,
      "X-Response-Time": `${opts.responseTime}ms`,
    },
  });
}

export function jsonList<T>(
  items: T[],
  opts: {
    status?: number;
    requestId: string;
    responseTime: number;
    pagination?: Pagination;
    extras?: Record<string, unknown>;
  }
) {
  const body: Record<string, unknown> = {
    success: true,
    ...opts.extras,
    data: items,
  };
  if (opts.pagination) {
    body.pagination = opts.pagination;
  } else {
    body.count = items.length;
  }
  return NextResponse.json(body, {
    status: opts.status ?? 200,
    headers: {
      "X-Request-Id": opts.requestId,
      "X-Response-Time": `${opts.responseTime}ms`,
    },
  });
}

export function jsonError(
  code: ErrorCode,
  message: string,
  status: number,
  requestId: string,
  responseTime: number
) {
  const body: { success: false; error: ApiErrorBody } = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, {
    status,
    headers: {
      "X-Request-Id": requestId,
      "X-Response-Time": `${responseTime}ms`,
    },
  });
}

export function jsonHealth(
  payload: Record<string, unknown>,
  requestId: string,
  responseTime: number
) {
  return NextResponse.json(
    { success: true, ...payload },
    {
      status: 200,
      headers: {
        "X-Request-Id": requestId,
        "X-Response-Time": `${responseTime}ms`,
      },
    }
  );
}

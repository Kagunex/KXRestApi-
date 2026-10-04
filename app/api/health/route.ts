import { NextRequest } from "next/server";
import { startRequest } from "@/lib/api-handler";
import { jsonHealth } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { requestId, elapsed } = startRequest(request);
  return jsonHealth(
    {
      name: "KXRestApi",
      status: "operational",
      timestamp: new Date().toISOString(),
      responseTime: elapsed(),
    },
    requestId,
    elapsed()
  );
}

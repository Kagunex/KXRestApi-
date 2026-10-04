import { withResponseTime } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  return withResponseTime(start, {
    success: true,
    name: "KXRestApi",
    status: "operational",
  });
}

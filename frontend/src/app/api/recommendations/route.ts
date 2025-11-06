import { NextResponse } from "next/server";
import { ordersServiceFetch } from "@/lib/backend";

export async function GET() {
  const response = await ordersServiceFetch("/api/recommendations/personal", {
    method: "GET",
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));
  // Forward service status to differentiate between 401 and 200 with empty list.
  return NextResponse.json(data, { status: response.status });
}

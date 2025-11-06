import { NextResponse } from "next/server";
import { ordersServiceFetch } from "@/lib/backend";

export async function GET() {
  const response = await ordersServiceFetch("/api/orders", {
    method: "GET",
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));
  // Bubble through the upstream status so components can react accordingly.
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const response = await ordersServiceFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));
  // Reuse the service's HTTP code to surface validation or stock errors.
  return NextResponse.json(data, { status: response.status });
}

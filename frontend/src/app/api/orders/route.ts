import { NextResponse } from "next/server";
import { ordersServiceFetch } from "@/lib/backend";

export async function GET() {
  const response = await ordersServiceFetch("/api/orders", {
    method: "GET",
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));
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
  return NextResponse.json(data, { status: response.status });
}
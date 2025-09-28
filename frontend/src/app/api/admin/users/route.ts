import { NextResponse } from "next/server";
import { authServiceFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  const response = await authServiceFetch(`/api/admin/users${query}`, {
    method: "GET",
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));

  return NextResponse.json(data, { status: response.status });
}
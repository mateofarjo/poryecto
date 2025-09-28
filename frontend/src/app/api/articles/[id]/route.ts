import { NextResponse } from "next/server";
import { ordersServiceFetch } from "@/lib/backend";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ message: "Missing article id" }, { status: 400 });
  }

  const payload = await request.json();
  const response = await ordersServiceFetch(`/api/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
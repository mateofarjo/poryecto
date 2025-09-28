import { NextResponse } from "next/server";
import { authServiceFetch } from "@/lib/backend";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ message: "Missing user id" }, { status: 400 });
  }

  const response = await authServiceFetch(`/api/admin/users/${id}/deactivate`, {
    method: "PATCH",
    requireAuth: true,
  });

  const data = await response.json().catch(() => ({}));

  return NextResponse.json(data, { status: response.status });
}
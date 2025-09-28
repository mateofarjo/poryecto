import { NextResponse } from "next/server";
import { authServiceFetch } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await authServiceFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[frontend] Register error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
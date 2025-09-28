import { NextResponse } from "next/server";
import { authServiceFetch } from "@/lib/backend";
import { setSessionCookies } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await authServiceFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    await setSessionCookies({ token: data.token, user: data.user });

    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error("[frontend] Login error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
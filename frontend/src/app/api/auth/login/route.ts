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

    if (!data.token || !data.refreshToken || !data.user) {
      console.error("[frontend] Login response missing token data");
      return NextResponse.json({ message: "Invalid authentication response" }, { status: 502 });
    }

    // Persist session for subsequent API calls within the app router.
    await setSessionCookies({
      token: data.token as string,
      refreshToken: data.refreshToken as string,
      user: data.user,
    });

    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error("[frontend] Login error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

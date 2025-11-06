import { cookies } from "next/headers";
import {
  getSessionFromCookies,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/session";
import type { SessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

const headers = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

type SessionEvent = {
  user: SessionUser | null;
  stale: boolean;
};

export async function GET(request: Request) {
  let sessionInterval: NodeJS.Timeout | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let previousPayload = "";

      // Helper to send a well-formed SSE payload.
      const enqueue = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const sendSession = async () => {
        try {
          const store = await cookies();
          const hasAuthCookies =
            Boolean(store.get(ACCESS_TOKEN_COOKIE)?.value) ||
            Boolean(store.get(REFRESH_TOKEN_COOKIE)?.value);

          const session = await getSessionFromCookies({
            refresh: false,
            mutateCookies: false,
          });
          let payload: SessionEvent;

          if (session) {
            payload = { user: session.user, stale: false };
          } else if (hasAuthCookies) {
            // Cookies exist but validation failed, so signal the client to re-fetch session data.
            payload = { user: null, stale: true };
          } else {
            payload = { user: null, stale: false };
          }

          const serialized = JSON.stringify(payload);

          if (serialized !== previousPayload) {
            enqueue("session", payload);
            previousPayload = serialized;
          }
        } catch {
          enqueue("error", { message: "SESSION_STREAM_ERROR" });
        }
      };

      const sendHeartbeat = () => {
        // Periodic ping keeps proxies from closing the long-lived connection.
        controller.enqueue(encoder.encode(`event: ping\n`));
        controller.enqueue(encoder.encode(`data: {}\n\n`));
      };

      void sendSession();
      sessionInterval = setInterval(sendSession, 30000);
      heartbeatInterval = setInterval(sendHeartbeat, 45000);

      const cleanup = () => {
        if (sessionInterval) {
          clearInterval(sessionInterval);
          sessionInterval = null;
        }
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        controller.close();
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    },
  });

  return new Response(stream, { headers });
}

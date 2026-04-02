// app/experiences/portal/route.ts

import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");
	const origin = url.searchParams.get("origin") || "/";
	const parentOrigin = (() => {
		try {
			return origin.startsWith("http") ? new URL(origin).origin : "*";
		} catch {
			return "*";
		}
	})();
	const isHttps = url.protocol === "https:";
	const cookieOptions = {
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
		sameSite: isHttps ? ("none" as const) : ("lax" as const),
		secure: isHttps,
	};

	if (!token) {
		const base = process.env.NEXT_PUBLIC_BASE_URL || "/";
		const absoluteBase = base.startsWith("http") ? base : new URL(base, request.url).toString();
		return NextResponse.redirect(absoluteBase);
	}

	const response = new NextResponse(
		`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Logging in…</title>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
      </head>
      <body>
        <script>
          (() => {
            const token = ${JSON.stringify(token)};
            const origin = ${JSON.stringify(origin)};
            const parentOrigin = ${JSON.stringify(parentOrigin)};
            const storeSession = (value) => {
              localStorage.setItem("authToken", value);
              localStorage.setItem("originAfterLogin", origin);
            };
            const finish = () => {
              window.location.replace("/experiences");
            };

            if (token) {
              storeSession(token);
              if (window.self !== window.top) {
                try {
                  window.parent.postMessage({ type: "KIMANI_AUTH", token }, parentOrigin);
                } catch {}
              }
              finish();
              return;
            }

            if (window.self !== window.top) {
              const handleAuth = (event) => {
                if (!event.data || event.data.type !== "KIMANI_AUTH" || typeof event.data.token !== "string") {
                  return;
                }
                storeSession(event.data.token);
                window.removeEventListener("message", handleAuth);
                finish();
              };

              window.addEventListener("message", handleAuth);

              try {
                window.parent.postMessage({ type: "KIMANI_REQUEST_TOKEN" }, parentOrigin);
              } catch {}

              setTimeout(() => {
                window.removeEventListener("message", handleAuth);
                finish();
              }, 1500);
              return;
            }

            finish();
          })();
        </script>
      </body>
    </html>`,
		{
			headers: {
				"Content-Type": "text/html",
			},
		},
	);

	response.cookies.set({
		name: "authToken",
		value: token,
		path: "/",
		sameSite: cookieOptions.sameSite,
		secure: cookieOptions.secure,
		maxAge: cookieOptions.maxAge,
	});

	response.cookies.set({
		name: "originAfterLogin",
		value: origin,
		path: "/",
		sameSite: cookieOptions.sameSite,
		secure: cookieOptions.secure,
		maxAge: cookieOptions.maxAge,
	});

	return response;
}

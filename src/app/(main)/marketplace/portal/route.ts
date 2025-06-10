// app/marketplace/portal/route.ts

import { NextResponse ,type  NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");
	const origin = url.searchParams.get("origin") || "/";

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
      </head>
      <body>
        <script>
          localStorage.setItem("authToken", ${JSON.stringify(token)});
          localStorage.setItem("originAfterLogin", ${JSON.stringify(origin)});
          window.location.href = "/";
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
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7,
	});

	response.cookies.set({
		name: "originAfterLogin",
		value: origin,
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7,
	});

	return response;
}

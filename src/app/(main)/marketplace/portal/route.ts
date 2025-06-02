// app/marketplace/portal/route.ts
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");
	const origin = url.searchParams.get("origin") || "/";

	const headers = new Headers();
	if (token) {
		headers.append("Set-Cookie", `token=${token}; HttpOnly; Secure; Path=/; SameSite=Lax`);
	}
	if (origin) {
		headers.append(
			"Set-Cookie",
			`origin=${encodeURIComponent(origin)}; HttpOnly; Secure; Path=/; SameSite=Lax`,
		);
	}
	headers.append("Location", "/");

	return new Response(null, { status: 302, headers });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.url;
	const searchParams = new URL(url).searchParams;

	console.log(`🔍 Middleware: ${url}`);

	const excludedPaths = [
		"/experiences/portal",
		"/experiences/create-experience",
		"/experiences/edit-experience",
		"/experiences",
	];

	if (excludedPaths.some((path) => url.includes(path))) {
		return NextResponse.next();
	}

	if (url.includes("/experiences/")) {
		const token = searchParams.get("token");
		const origin = searchParams.get("origin");

		if (!token && !origin) {
			return NextResponse.next();
		}

		const redirectUrl = new URL("/experiences", url);
		const response = NextResponse.redirect(redirectUrl);

		if (token) {
			response.cookies.set("kimani_token", token, {
				path: "/",
				httpOnly: true,
			});
		}

		if (origin) {
			response.cookies.set("kimani_origin", origin, {
				path: "/",
				httpOnly: true,
			});
		}

		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/experiences/:path*"],
};

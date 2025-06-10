import { NextResponse, type NextRequest } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "/";

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - marketplace/portal (login route handler)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		"/((?!api|marketplace/portal|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === "/marketplace/portal" || pathname.startsWith("/marketplace/portal/")) {
		return NextResponse.next();
	}

	const tokenCookie = request.cookies.get("authToken");
	if (!tokenCookie) {
		return NextResponse.redirect(new URL(BASE_URL, request.url));
	}

	return NextResponse.next();
}

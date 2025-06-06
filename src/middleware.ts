import { NextResponse ,type  NextRequest } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "/";

export const config = {
	matcher: ["/:path*"],
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

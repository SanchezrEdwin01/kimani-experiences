// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const { pathname, searchParams } = url;

	console.log(`🔍 Middleware: ${pathname}`);

	// Rutas EXCLUIDAS del redireccionamiento
	// Estas rutas deben funcionar normalmente
	const excludedPaths = [
		"/experiences/portal",
		"/experiences/create-experience",
		"/experiences/edit-experience",
		"/experiences", // La página principal también debe funcionar
		// Agrega otras rutas que necesites aquí
	];

	// Si es una ruta excluida, continuar normalmente
	if (excludedPaths.includes(pathname)) {
		console.log(`✅ Ruta permitida: ${pathname}`);
		return NextResponse.next();
	}

	// Si comienza con /experiences/ y NO es una ruta excluida
	if (pathname.startsWith("/experiences/")) {
		const token = searchParams.get("token");
		const origin = searchParams.get("origin");

		console.log(`📦 Token: ${token}, Origin: ${origin}`);

		// Si NO tiene token ni origin, continuar normalmente
		// Esto permite otras rutas futuras bajo /experiences/
		if (!token && !origin) {
			console.log(`⚠️  Ruta /experiences/ sin token/origin - Continuando`);
			return NextResponse.next();
		}

		// REDIRIGIR solo si hay token u origin
		console.log(`🔄 Redirigiendo a /experiences desde: ${pathname}`);
		const redirectUrl = new URL("/experiences", request.url);
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

// src/lib/useUrlParamsProcessor.ts
"use client";

import { useEffect, useRef } from "react";

const BASE_URL_KEY = "kimani_base_url";
const TOKEN_KEY = "authToken"; // Mismo key que usa api-client.ts

/**
 * Hook que procesa los parámetros de URL (origin, token) y los guarda en localStorage.
 * Debe usarse en ClientProviders para que se ejecute en todas las páginas.
 *
 * Esto permite que cualquier página con ?origin=...&token=... funcione correctamente,
 * sin necesidad de una página /portal dedicada.
 */
export function useUrlParamsProcessor() {
	const processed = useRef(false);

	useEffect(() => {
		// Solo procesar una vez
		if (processed.current) return;
		if (typeof window === "undefined") return;

		const urlParams = new URLSearchParams(window.location.search);
		const urlToken = urlParams.get("token");
		const urlBaseUrl = urlParams.get("origin") || urlParams.get("native");

		let hasChanges = false;

		// Guardar base URL si viene en la URL
		if (urlBaseUrl) {
			console.log("[UrlParams] Saving base URL:", urlBaseUrl);
			localStorage.setItem(BASE_URL_KEY, urlBaseUrl);
			hasChanges = true;
		}

		// Guardar token si viene en la URL
		if (urlToken) {
			console.log("[UrlParams] Saving token");
			localStorage.setItem(TOKEN_KEY, urlToken);
			hasChanges = true;
		}

		// Limpiar los params de la URL para que no se vean (seguridad)
		if (hasChanges) {
			const newUrl = window.location.pathname;
			window.history.replaceState({}, "", newUrl);

			// Forzar recarga de datos si hubo cambios
			// Esto es necesario porque React Query puede haber cacheado el resultado anterior
			window.location.reload();
		}

		processed.current = true;
	}, []);
}

/**
 * Obtiene el token guardado
 */
export function getStoredToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
}

/**
 * Obtiene la base URL guardada
 */
export function getStoredBaseUrl(): string {
	if (typeof window === "undefined") return "https://community.kimanilife.com";
	return localStorage.getItem(BASE_URL_KEY) || "https://community.kimanilife.com";
}

/**
 * Limpia la sesión
 */
export function clearSession(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(TOKEN_KEY);
}

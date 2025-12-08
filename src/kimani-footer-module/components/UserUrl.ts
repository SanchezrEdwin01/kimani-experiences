"use client";

import { useEffect } from "react";

const BASE_URL_KEY = "kimani_base_url";
const TOKEN_KEY = "kimani_token";

export function useUrlParamsProcessor() {
	useEffect(() => {
		if (typeof window === "undefined") return;

		const urlParams = new URLSearchParams(window.location.search);
		const urlToken = urlParams.get("token");
		const urlBaseUrl = urlParams.get("origin") || urlParams.get("native");

		let shouldCleanUrl = false;

		// Guardar base URL si viene en la URL
		if (urlBaseUrl) {
			console.log("[UrlParams] Saving base URL:", urlBaseUrl);
			localStorage.setItem(BASE_URL_KEY, urlBaseUrl);
			shouldCleanUrl = true;
		}

		// Guardar token si viene en la URL
		if (urlToken) {
			console.log("[UrlParams] Saving token");
			localStorage.setItem(TOKEN_KEY, urlToken);
			shouldCleanUrl = true;
		}

		// Limpiar los params de la URL para que no se vean
		if (shouldCleanUrl) {
			const newUrl = window.location.pathname;
			window.history.replaceState({}, "", newUrl);
		}
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
 * Construye la API URL
 */
export function getApiUrl(): string {
	return `${getStoredBaseUrl()}/api`;
}

/**
 * Limpia la sesión
 */
export function clearSession(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(TOKEN_KEY);
}

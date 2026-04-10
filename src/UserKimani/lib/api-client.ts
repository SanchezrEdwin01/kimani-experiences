// src/UserKimani/lib/api-client.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosRequestHeaders } from "axios";

// Keys de localStorage
const BASE_URL_KEY = "kimani_base_url";
const TOKEN_KEY = "authToken"; // Mantener consistencia con el proyecto existente

// URL por defecto
const DEFAULT_API_URL = "https://app.kimaniclub.com/api";

/**
 * Obtiene la API URL dinámica.
 * Prioridad: localStorage > default
 */
function getApiUrl(): string {
	if (typeof window === "undefined") {
		return DEFAULT_API_URL;
	}
	const storedBaseUrl = localStorage.getItem(BASE_URL_KEY);
	if (storedBaseUrl) {
		return `${storedBaseUrl}/api`;
	}
	return DEFAULT_API_URL;
}

/**
 * Obtiene el token de sesión
 */
function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
}

// Crear instancia de axios sin baseURL fija
export const apiClient: AxiosInstance = axios.create({
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor que configura baseURL y token dinámicamente en cada request
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Establecer baseURL dinámicamente en cada request
		config.baseURL = getApiUrl();

		// Agregar token si existe
		if (typeof window !== "undefined") {
			const token = getToken();
			if (token) {
				if (!config.headers) {
					config.headers = {} as AxiosRequestHeaders;
				}
				config.headers["x-session-token"] = token;
			}
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Exportar helpers para uso externo
export { getApiUrl, getToken, BASE_URL_KEY, TOKEN_KEY };

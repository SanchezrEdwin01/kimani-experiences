"use client";

import { create } from "zustand";

// ============================================
// CONFIGURACIÓN
// ============================================
const DEFAULT_CONFIG = {
	BASE_URL: "https://community.kimanilife.com",
	DEFAULT_SERVER_ID: process.env.NEXT_PUBLIC_KIMANI_SERVER_ID || "01HP41709DFJP1DRSTSA88J81A",
};

const BASE_URL_KEY = "kimani_base_url";
const TOKEN_KEY = "kimani_token";

// ============================================
// TIPOS
// ============================================
export interface UserStatus {
	presence?: "Online" | "Idle" | "Focus" | "Busy" | "Invisible";
	text?: string;
}

export interface User {
	_id?: string;
	id?: string;
	username?: string;
	displayName?: string;
	display_name?: string;
	avatar?: string | { _id: string; tag: string; filename: string; content_type: string };
	defaultAvatarURL?: string;
	online?: boolean;
	status?: UserStatus;
}

interface ServerMember {
	roles?: string[];
}

interface Server {
	owner?: string;
}

interface UserState {
	user: User | null;
	isAdmin: boolean;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;

	fetchUser: () => Promise<void>;
	logout: () => void;
	getBaseUrl: () => string;
	getToken: () => string | null;
}

// ============================================
// HELPERS - Exportados para uso externo
// ============================================

/**
 * Obtiene un parámetro de la URL actual
 */
export function getUrlParameter(name: string): string | null {
	if (typeof window === "undefined") return null;
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}

/**
 * Obtiene la URL base guardada o el default
 */
export function getStoredBaseUrl(): string {
	if (typeof window === "undefined") {
		return process.env.NEXT_PUBLIC_KIMANI_BASE_URL || DEFAULT_CONFIG.BASE_URL;
	}

	const stored = localStorage.getItem(BASE_URL_KEY);
	if (stored) return stored;

	return process.env.NEXT_PUBLIC_KIMANI_BASE_URL || DEFAULT_CONFIG.BASE_URL;
}

/**
 * Obtiene el token guardado
 */
export function getStoredToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
}

/**
 * Guarda la base URL en localStorage
 */
export function saveBaseUrl(url: string): void {
	if (typeof window !== "undefined") {
		localStorage.setItem(BASE_URL_KEY, url);
	}
}

/**
 * Guarda el token en localStorage
 */
export function saveToken(token: string): void {
	if (typeof window !== "undefined") {
		localStorage.setItem(TOKEN_KEY, token);
	}
}

/**
 * Procesa y guarda los parámetros de autenticación de la URL actual.
 * Busca 'token' y 'origin'/'native' en los query params.
 * Retorna true si encontró y guardó nuevos valores.
 */
export function processAuthParams(): { hasNewData: boolean; token: string | null; baseUrl: string } {
	if (typeof window === "undefined") {
		return { hasNewData: false, token: null, baseUrl: DEFAULT_CONFIG.BASE_URL };
	}

	const urlToken = getUrlParameter("token");
	const urlBaseUrl = getUrlParameter("origin") || getUrlParameter("native");

	let hasNewData = false;

	if (urlBaseUrl) {
		saveBaseUrl(urlBaseUrl);
		hasNewData = true;
	}

	if (urlToken) {
		saveToken(urlToken);
		hasNewData = true;
	}

	return {
		hasNewData,
		token: urlToken || getStoredToken(),
		baseUrl: getStoredBaseUrl(),
	};
}

/**
 * Construye la API URL
 */
export function getApiUrl(): string {
	return `${getStoredBaseUrl()}/api`;
}

/**
 * Construye la Autumn URL
 */
export function getAutumnUrl(): string {
	return `${getStoredBaseUrl()}/autumn`;
}

// ============================================
// STORE
// ============================================
export const useUserStore = create<UserState>((set, get) => ({
	user: null,
	isAdmin: false,
	isLoading: false,
	isInitialized: false,
	error: null,

	getBaseUrl: () => getStoredBaseUrl(),
	getToken: () => getStoredToken(),

	fetchUser: async () => {
		if (get().isLoading) return;

		set({ isLoading: true, error: null });

		try {
			// Obtener token (ya debe estar procesado)
			const token = getStoredToken();

			if (!token) {
				set({ user: null, isLoading: false, isInitialized: true });
				return;
			}

			const apiUrl = getApiUrl();

			const response = await fetch(`${apiUrl}/users/@me`, {
				method: "GET",
				headers: {
					"X-Session-Token": token,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				if (response.status === 401) {
					get().logout();
					return;
				}
				throw new Error(`API error: ${response.status}`);
			}

			const user = (await response.json()) as User;

			// Admin check
			let isAdmin = false;
			try {
				const serverId = DEFAULT_CONFIG.DEFAULT_SERVER_ID;
				const userId = user._id || user.id;

				if (serverId && userId) {
					const serverRes = await fetch(`${apiUrl}/servers/${serverId}`, {
						headers: { "X-Session-Token": token },
					});

					if (serverRes.ok) {
						const server = (await serverRes.json()) as Server;

						if (server.owner === userId) {
							isAdmin = true;
						} else {
							const memberRes = await fetch(
								`${apiUrl}/servers/${serverId}/members/${encodeURIComponent(userId)}`,
								{ headers: { "X-Session-Token": token } },
							).catch(() => null);

							if (memberRes?.ok) {
								const member = (await memberRes.json()) as ServerMember;
								const adminRoles = ["admin"];
								if (member.roles?.some((r) => adminRoles.includes(r.toLowerCase()))) {
									isAdmin = true;
								}
							}
						}
					}
				}
			} catch {
				// Ignorar errores de admin check
			}

			set({ user, isAdmin, isLoading: false, isInitialized: true });
		} catch (error) {
			console.error("[UserStore] Failed to fetch user:", error);
			set({
				user: null,
				isLoading: false,
				isInitialized: true,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},

	logout: () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem(TOKEN_KEY);
		}
		set({ user: null, isAdmin: false, error: null, isInitialized: true });
	},
}));

// ============================================
// HOOKS
// ============================================

export const useKimaniUser = () => {
	const { user, isAdmin, isLoading, fetchUser, isInitialized } = useUserStore();

	return {
		data: user ? { user, isAdmin } : null,
		isLoading,
		isInitialized,
		refresh: fetchUser,
	};
};

export const useBaseURL = (): string => {
	const getBaseUrl = useUserStore((state) => state.getBaseUrl);
	return getBaseUrl();
};

/**
 * Genera URL para archivos/avatares
 */
export function generateFileURL(
	file?: string | { _id: string; tag?: string; filename?: string } | null,
	options?: { max_side?: number },
	_animate?: boolean,
): string | null {
	if (!file) return null;

	let fileId: string;

	if (typeof file === "object" && file._id) {
		fileId = file._id;
	} else if (typeof file === "string") {
		if (file.startsWith("http://") || file.startsWith("https://")) {
			return file;
		}
		fileId = file;
	} else {
		return null;
	}

	const autumnUrl = getAutumnUrl();
	const maxSide = options?.max_side || 256;
	return `${autumnUrl}/avatars/${fileId}?max_side=${maxSide}`;
}

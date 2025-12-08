"use client";

import { create } from "zustand";

// ============================================
// CONFIGURACIÓN - Ajusta estas URLs según tu entorno
// ============================================
const CONFIG = {
	BASE_URL: process.env.NEXT_PUBLIC_KIMANI_BASE_URL || "https://community.kimanilife.com",
	API_URL: process.env.NEXT_PUBLIC_KIMANI_API_URL || "https://community.kimanilife.com/api",
	AUTUMN_URL: process.env.NEXT_PUBLIC_KIMANI_AUTUMN_URL || "https://community.kimanilife.com/autumn",
	DEFAULT_SERVER_ID: process.env.NEXT_PUBLIC_KIMANI_SERVER_ID || "01HP41709DFJP1DRSTSA88J81A",
};

const BASE_URL_KEY = "base_url";
const TOKEN_KEY = "token";

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

	// Actions
	fetchUser: () => Promise<void>;
	logout: () => void;
	getBaseUrl: () => string;
	getToken: () => string | null;
}

// ============================================
// HELPERS
// ============================================
function getUrlParameter(name: string): string | null {
	if (typeof window === "undefined") return null;
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}

function getStoredBaseUrl(): string {
	if (typeof window === "undefined") return CONFIG.BASE_URL;
	return localStorage.getItem(BASE_URL_KEY) || CONFIG.BASE_URL;
}

function getStoredToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
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
		// Evitar múltiples llamadas simultáneas
		if (get().isLoading) return;

		set({ isLoading: true, error: null });

		try {
			// 1. Verificar si hay token en URL (para webviews nativos)
			const urlToken = getUrlParameter("token");
			const nativeBaseUrl = getUrlParameter("native");

			if (nativeBaseUrl && typeof window !== "undefined") {
				localStorage.setItem(BASE_URL_KEY, nativeBaseUrl);
			}

			if (urlToken && typeof window !== "undefined") {
				localStorage.setItem(TOKEN_KEY, urlToken);
			}

			// 2. Obtener el token final
			const token = urlToken || getStoredToken();

			if (!token) {
				set({ user: null, isLoading: false, isInitialized: true });
				return;
			}

			// 3. Llamar a la API para obtener el usuario
			const response = await fetch(`${CONFIG.API_URL}/users/@me`, {
				method: "GET",
				headers: {
					"X-Session-Token": token,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				if (response.status === 401) {
					// Token inválido, limpiar
					get().logout();
					return;
				}
				throw new Error(`API error: ${response.status}`);
			}

			const user = (await response.json()) as User;

			// 4. Intentar obtener info de admin (opcional)
			let isAdmin = false;
			try {
				const serverId = CONFIG.DEFAULT_SERVER_ID;
				const userId = user._id || user.id;

				if (serverId && userId) {
					const serverRes = await fetch(`${CONFIG.API_URL}/servers/${serverId}`, {
						headers: { "X-Session-Token": token },
					});

					if (serverRes.ok) {
						const server = (await serverRes.json()) as Server;

						// Verificar si es owner
						if (server.owner === userId) {
							isAdmin = true;
						} else {
							// Intentar obtener member info
							const memberRes = await fetch(
								`${CONFIG.API_URL}/servers/${serverId}/members/${encodeURIComponent(userId)}`,
								{ headers: { "X-Session-Token": token } },
							).catch(() => null);

							if (memberRes?.ok) {
								const member = (await memberRes.json()) as ServerMember;
								// Verificar roles de admin
								const adminRoles = ["admin"];
								if (member.roles?.some((r) => adminRoles.includes(r.toLowerCase()))) {
									isAdmin = true;
								}
							}
						}
					}
				}
			} catch (adminError) {
				// Ignorar errores de admin check, no es crítico
				console.warn("[UserStore] Admin check failed:", adminError);
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
		set({ user: null, isAdmin: false, error: null });
	},
}));

// ============================================
// HOOKS CONVENIENTES
// ============================================

/**
 * Hook principal para obtener el usuario - equivalente a useUser() del proyecto original
 */
export const useKimaniUser = () => {
	const { user, isAdmin, isLoading, fetchUser, isInitialized } = useUserStore();

	return {
		data: user ? { user, isAdmin } : null,
		isLoading,
		isInitialized,
		refresh: fetchUser,
	};
};

/**
 * Hook para obtener la baseUrl - equivalente a useBaseURL() del proyecto original
 */
export const useBaseURL = (): string => {
	const getBaseUrl = useUserStore((state) => state.getBaseUrl);
	return getBaseUrl();
};

/**
 * Genera URL para archivos/avatares del servidor Autumn de Kimani
 */
export function generateFileURL(
	file?: string | { _id: string; tag?: string; filename?: string } | null,
	options?: { max_side?: number },
	_animate?: boolean,
): string | null {
	if (!file) return null;

	let fileId: string;

	// Manejar objeto de archivo
	if (typeof file === "object" && file._id) {
		fileId = file._id;
	} else if (typeof file === "string") {
		// Si ya es una URL completa
		if (file.startsWith("http://") || file.startsWith("https://")) {
			return file;
		}
		fileId = file;
	} else {
		return null;
	}

	const maxSide = options?.max_side || 256;
	return `${CONFIG.AUTUMN_URL}/avatars/${fileId}?max_side=${maxSide}`;
}

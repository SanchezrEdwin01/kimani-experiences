"use client";

import { useEffect } from "react";

const AUTH_TOKEN_KEY = "authToken";
const BASE_URL_KEYS = ["originAfterLogin", "kimani_base_url"] as const;

export const KIMANI_MESSAGE_TYPES = {
	AUTH: "KIMANI_AUTH",
	REQUEST_TOKEN: "KIMANI_REQUEST_TOKEN",
	NAVIGATE: "KIMANI_NAVIGATE",
} as const;

const ALLOWED_PARENT_HOSTS = new Set(["community.kimanilife.com", "staging.kimanilife.com"]);

function isLocalhostOrigin(origin: string) {
	return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function isEmbeddedWindow() {
	return typeof window !== "undefined" && window.self !== window.top;
}

export function getStoredBaseURL() {
	if (typeof window === "undefined") return null;

	for (const key of BASE_URL_KEYS) {
		const value = localStorage.getItem(key);
		if (value) return value;
	}

	return null;
}

export function getOriginFromURL(value: string | null | undefined) {
	if (!value) return null;

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function getMessageValue(data: unknown, key: string) {
	if (!data || typeof data !== "object") return null;

	const value = (data as Record<string, unknown>)[key];
	return typeof value === "string" ? value : null;
}

export function isAllowedParentOrigin(origin: string) {
	if (origin === "capacitor://localhost") return true;
	if (isLocalhostOrigin(origin)) return true;

	try {
		const url = new URL(origin);
		return ALLOWED_PARENT_HOSTS.has(url.hostname);
	} catch {
		return false;
	}
}

export function navigateToParentIfNeeded(href: string, parentBaseURL: string) {
	if (typeof window === "undefined" || !isEmbeddedWindow() || href === "#") return false;

	const parentOrigin = getOriginFromURL(parentBaseURL);
	if (!parentOrigin) return false;

	let target: URL;
	try {
		target = new URL(href, parentBaseURL);
	} catch {
		return false;
	}

	if (target.origin !== parentOrigin) return false;

	const path = `${target.pathname}${target.search}${target.hash}` || "/";
	window.parent.postMessage({ type: KIMANI_MESSAGE_TYPES.NAVIGATE, path }, parentOrigin);
	return true;
}

export function usePortalMessageBridge() {
	useEffect(() => {
		if (typeof window === "undefined" || !isEmbeddedWindow()) return;

		const handleMessage = (event: MessageEvent) => {
			if (!isAllowedParentOrigin(event.origin)) return;

			const messageType = getMessageValue(event.data, "type");

			if (messageType === KIMANI_MESSAGE_TYPES.AUTH) {
				const token = getMessageValue(event.data, "token");
				if (!token) return;

				const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
				if (currentToken !== token) {
					localStorage.setItem(AUTH_TOKEN_KEY, token);
					window.location.reload();
				}
				return;
			}

			if (messageType === KIMANI_MESSAGE_TYPES.REQUEST_TOKEN) {
				const token = localStorage.getItem(AUTH_TOKEN_KEY);
				if (token && event.source && "postMessage" in event.source) {
					event.source.postMessage(
						{ type: KIMANI_MESSAGE_TYPES.AUTH, token },
						{ targetOrigin: event.origin },
					);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);
}

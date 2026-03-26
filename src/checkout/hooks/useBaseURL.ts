// hooks/useBaseURL.ts
import { useEffect, useState } from "react";

const LEGACY_BASE_URL_KEY = "kimani_base_url";
const PORTAL_BASE_URL_KEY = "originAfterLogin";

function getStoredBaseURL() {
	if (typeof window === "undefined") return null;

	return localStorage.getItem(PORTAL_BASE_URL_KEY) || localStorage.getItem(LEGACY_BASE_URL_KEY);
}

export function useBaseURL(): string {
	const envBase = process.env.NEXT_PUBLIC_BASE_URL || "";
	const [baseURL, setBaseURL] = useState(envBase);

	useEffect(() => {
		const saved = getStoredBaseURL();
		if (saved) setBaseURL(saved);
	}, []);

	return baseURL;
}

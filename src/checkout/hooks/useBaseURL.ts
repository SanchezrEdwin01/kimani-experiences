// hooks/useBaseURL.ts
import { useEffect, useState } from "react";

export function useBaseURL(): string {
	const envBase = process.env.NEXT_PUBLIC_BASE_URL || "";
	const [baseURL, setBaseURL] = useState(envBase);

	useEffect(() => {
		const saved = localStorage.getItem("originAfterLogin");
		if (saved) setBaseURL(saved);
	}, []);

	return baseURL;
}

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PortalPage() {
	const router = useRouter();
	const params = useSearchParams();

	useEffect(() => {
		const token = params.get("token");
		const origin = params.get("origin") || "/";

		if (token) {
			localStorage.setItem("authToken", token);
			localStorage.setItem("originAfterLogin", origin);

			const newSearchParams = new URLSearchParams(window.location.search);
			newSearchParams.delete("token");
			newSearchParams.delete("origin");

			const cleanUrl =
				window.location.pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : "");

			router.replace(cleanUrl);

			router.push("/");
		}
	}, [params, router]);

	return (
		<div style={{ padding: "2rem" }}>
			<p>Procesando inicio de sesión…</p>
		</div>
	);
}

// src/components/ClientProviders.tsx
"use client";

import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUrlParamsProcessor } from "../lib/useUrlParamsProcessor";
import { UserProvider } from "@/UserKimani/context/UserContext";
import { SERVER_ID } from "@/UserKimani/constants/server";

function UrlParamsHandler({ children }: { children: ReactNode }) {
	// Procesa origin y token de la URL y los guarda en localStorage
	useUrlParamsProcessor();
	return <>{children}</>;
}

export function ClientProviders({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: false,
						refetchOnWindowFocus: false,
						refetchOnMount: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<UrlParamsHandler>
				<UserProvider serverId={SERVER_ID}>{children}</UserProvider>
			</UrlParamsHandler>
		</QueryClientProvider>
	);
}

// src/components/ClientProviders.tsx
"use client";
import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/UserKimani/context/UserContext";

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
			<UserProvider>{children}</UserProvider>
		</QueryClientProvider>
	);
}

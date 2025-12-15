"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/UserKimani/context/UserContext";
import { SERVER_ID } from "@/UserKimani/constants/server";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<UserProvider serverId={SERVER_ID}>{children}</UserProvider>
		</QueryClientProvider>
	);
}

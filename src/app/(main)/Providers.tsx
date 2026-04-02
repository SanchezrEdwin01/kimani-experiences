"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/UserKimani/context/UserContext";
import { SERVER_ID } from "@/UserKimani/constants/server";
import { usePortalMessageBridge } from "@/lib/iframeBridge";

const queryClient = new QueryClient();

function PortalMessageBridge() {
	usePortalMessageBridge();
	return null;
}

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<PortalMessageBridge />
			<UserProvider serverId={SERVER_ID}>{children}</UserProvider>
		</QueryClientProvider>
	);
}

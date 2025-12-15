// src/UserKimani/hooks/useCurrentMember.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import type { ServerMember } from "../types/serverMember";

export const useCurrentMember = (serverId?: string, userId?: string) =>
	useQuery<ServerMember | null>({
		queryKey: ["currentMember", serverId, userId],
		queryFn: async (): Promise<ServerMember | null> => {
			if (!serverId || !userId) return null;

			const response = await apiClient.get<ServerMember>(`/servers/${serverId}/members/${userId}`);

			return response.data;
		},
		enabled: Boolean(serverId && userId),
	});

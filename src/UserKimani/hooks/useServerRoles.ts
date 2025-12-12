// src/UserKimani/hooks/useServerRoles.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { type ServerRole } from "../types/serverRole";

export const useServerRoles = (serverId?: string) =>
	useQuery<ServerRole[]>({
		queryKey: ["serverRoles", serverId],
		queryFn: async (): Promise<ServerRole[]> => {
			if (!serverId) return [];

			const response = await apiClient.get<ServerRole[]>(`/servers/${serverId}/roles`);

			return response.data;
		},
		enabled: !!serverId,
	});

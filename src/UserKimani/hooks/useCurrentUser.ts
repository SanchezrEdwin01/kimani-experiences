// src/UserKimani/hooks/useCurrentUser.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../lib/api-client";
import { type User } from "../types";

const CACHE_KEY = "currentUser";

export const useCurrentUser = () =>
	useQuery<User | null>({
		queryKey: [CACHE_KEY],
		queryFn: async (): Promise<User | null> => {
			try {
				const response = await apiClient.get<User>("/users/@me");
				return response.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 401) {
					return null;
				}
				throw error;
			}
		},
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		enabled: true,
	});

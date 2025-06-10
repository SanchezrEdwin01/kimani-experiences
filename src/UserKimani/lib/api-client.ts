// src/UserKimani/lib/api-client.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosRequestHeaders } from "axios";
import { API_URL } from "@/UserKimani/utils/constants";

export const apiClient: AxiosInstance = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		if (typeof window !== "undefined") {
			const token = window.localStorage.getItem("authToken");
			if (token) {
				if (!config.headers) {
					config.headers = {} as AxiosRequestHeaders;
				}
				config.headers["x-session-token"] = token;
			}
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

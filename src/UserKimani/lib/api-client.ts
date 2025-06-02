import axios from "axios";
import { API_URL } from "@/UserKimani/utils/constants";

export const apiClient = axios.create({
	baseURL: API_URL,
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

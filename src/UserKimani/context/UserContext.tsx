// src/UserKimani/context/UserContext.tsx
"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { type User } from "../types";

interface UserContextType {
	user: User | null;
	isLoading: boolean;
	isError: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const { data, isLoading, isError } = useCurrentUser();
	const user = data ?? null;

	return <UserContext.Provider value={{ user, isLoading, isError }}>{children}</UserContext.Provider>;
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error("useUser must be used within a UserProvider");
	return ctx;
}

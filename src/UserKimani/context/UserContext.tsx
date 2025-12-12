"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { type User } from "../types";
import { type ServerMember } from "../types/serverMember";
import { type ServerRole } from "../types/serverRole";
import { useUserRoles } from "../hooks/useUserRoles";

interface UserContextType {
	user: User | null;
	member: ServerMember | null;
	roles: ServerRole[];
	isLoading: boolean;
	isError: boolean;
	hasRole: (roleName: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, serverId }: { children: ReactNode; serverId: string }) {
	const { data: user, isLoading, isError } = useCurrentUser();

	const { member, roles, isLoading: rolesLoading } = useUserRoles(serverId, user?._id);

	const hasRole = (roleName: string) => roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());

	return (
		<UserContext.Provider
			value={{
				user: user ?? null,
				member: member ?? null,
				roles,
				isLoading: isLoading || rolesLoading,
				isError,
				hasRole,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return ctx;
}

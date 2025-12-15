"use client";
import { createContext, useContext, type ReactNode, useMemo } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useCurrentMember } from "../hooks/useCurrentMember";
import type { ServerMember } from "../types/serverMember";
import type { User } from "../types";
import { ADMIN_ROLE_ID } from "../constants/roles";

interface UserContextType {
	user: User | null;
	member: ServerMember | null;
	isAdmin: boolean;
	hasRoleId: (roleId: string) => boolean;
	isLoading: boolean;
	isError: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, serverId }: { children: ReactNode; serverId: string }) {
	const { data: user, isLoading, isError } = useCurrentUser();

	const { data: member, isLoading: memberLoading } = useCurrentMember(serverId, user?._id);

	const hasRoleId = (roleId: string) => Boolean(member?.roles.includes(roleId));

	const isAdmin = useMemo(() => hasRoleId(ADMIN_ROLE_ID), [member]);

	return (
		<UserContext.Provider
			value={{
				user: user ?? null,
				member: member ?? null,
				isAdmin,
				hasRoleId,
				isLoading: isLoading || memberLoading,
				isError,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error("useUser must be used within UserProvider");
	return ctx;
}

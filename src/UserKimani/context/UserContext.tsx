"use client";

import { createContext, useContext, type ReactNode, useMemo, useCallback } from "react";

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

// 🔴 CAMBIA ESTO A false CUANDO TERMINES
const FORCE_ADMIN = true;

export function UserProvider({ children, serverId }: { children: ReactNode; serverId: string }) {
	const { data: user, isLoading: userLoading, isError } = useCurrentUser();

	const { data: member, isLoading: memberLoading } = useCurrentMember(serverId, user?._id);

	const hasRoleId = useCallback(
		(roleId: string) => {
			if (FORCE_ADMIN && roleId === ADMIN_ROLE_ID) return true;
			return Boolean(member?.roles?.includes(roleId));
		},
		[member],
	);

	const isAdmin = useMemo(() => {
		if (FORCE_ADMIN) return true;
		return hasRoleId(ADMIN_ROLE_ID);
	}, [hasRoleId]);

	return (
		<UserContext.Provider
			value={{
				user: user ?? null,
				member: member ?? null,
				isAdmin,
				hasRoleId,
				isLoading: userLoading || memberLoading,
				isError,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) {
		throw new Error("useUser must be used within UserProvider");
	}
	return ctx;
}

// src/UserKimani/hooks/useUserRoles.ts
import { useCurrentMember } from "./useCurrentMember";
import { useServerRoles } from "./useServerRoles";

export const useUserRoles = (serverId?: string, userId?: string) => {
	const memberQuery = useCurrentMember(serverId, userId);
	const rolesQuery = useServerRoles(serverId);

	const roles =
		memberQuery.data && rolesQuery.data
			? rolesQuery.data.filter((role) => memberQuery.data!.roles.includes(role._id))
			: [];

	return {
		member: memberQuery.data,
		roles,
		isLoading: memberQuery.isLoading || rolesQuery.isLoading,
	};
};

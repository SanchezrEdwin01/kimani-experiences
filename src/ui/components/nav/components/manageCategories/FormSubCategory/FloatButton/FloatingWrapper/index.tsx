"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloatingButtonLayoutCreate } from "../floatButton";

interface Props {
	children: ReactNode;
	parent?: string;
	baseCreateRoute?: string; // Nueva prop para la ruta base de creación
}

export const ClientFloatingWrapperSub = ({ children, parent, baseCreateRoute }: Props) => {
	const router = useRouter();

	const handleFloatingClick = () => {
		const defaultRoute = "/experiences/service-providers/admin-category/event-planning/create-sub-category";
		const routeToUse = baseCreateRoute || defaultRoute;
		const url = parent ? `${routeToUse}?parent=${parent}` : routeToUse;
		try {
			void router.push(url);
		} catch {
			window.location.href = url;
		}
	};

	return <FloatingButtonLayoutCreate onClick={handleFloatingClick}>{children}</FloatingButtonLayoutCreate>;
};

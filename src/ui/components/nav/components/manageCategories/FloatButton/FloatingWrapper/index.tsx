"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloatingButtonLayoutCreate } from "../floatButton";

interface Props {
	children: ReactNode;
}

export const ClientFloatingWrapper = ({ children }: Props) => {
	const router = useRouter();

	const handleFloatingClick = () => {
		console.log("Floating + clicked");
		try {
			void router.push("/experiences/service-providers/admin-category/create-category");
		} catch (error) {
			console.error("Error navegando:", error);
			window.location.href = "/experiences/service-providers/admin-category/create-category";
		}
	};

	return <FloatingButtonLayoutCreate onClick={handleFloatingClick}>{children}</FloatingButtonLayoutCreate>;
};

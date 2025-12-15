"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloatingButtonLayout } from "../index";

interface Props {
	children: ReactNode;
}

export const ClientFloatingWrapper = ({ children }: Props) => {
	const router = useRouter();

	const handleFloatingClick = () => {
		console.log("Floating + clicked");
		router.push("/experiences/service-providers/create-service");
	};

	return <FloatingButtonLayout onClick={handleFloatingClick}>{children}</FloatingButtonLayout>;
};

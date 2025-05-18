"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloatingButtonLayout } from "../floatButton";

interface Props {
	children: ReactNode;
}

export const ClientFloatingWrapper = ({ children }: Props) => {
	const router = useRouter();

	const handleFloatingClick = () => {
		console.log("Floating + clicked");
		void router.push("/marketplace/service-providers/create-service");
	};

	return <FloatingButtonLayout onClick={handleFloatingClick}>{children}</FloatingButtonLayout>;
};

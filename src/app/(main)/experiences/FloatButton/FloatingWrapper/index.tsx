"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloatingButtonExperiences } from "../floatButton";

interface Props {
	children?: ReactNode;
	parent?: string;
}

export const ClientFloatingExperiences = ({ children, parent }: Props) => {
	const router = useRouter();

	const handleFloatingClick = () => {
		const base = "experiences/create-experience";
		const url = parent ? `${base}?parent=${parent}` : base;
		try {
			void router.push(url);
		} catch {
			window.location.href = url;
		}
	};

	return <FloatingButtonExperiences onClick={handleFloatingClick}>{children}</FloatingButtonExperiences>;
};

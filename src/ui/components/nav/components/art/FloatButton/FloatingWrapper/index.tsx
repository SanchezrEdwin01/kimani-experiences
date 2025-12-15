"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloatingButtonLayoutCreate } from "../floatButton";

interface Props {
	children: ReactNode;
	parent?: string;
}

export const ClientFloatingWrapperArt = ({ children, parent }: Props) => {
	const router = useRouter();

	const handleFloatingClick = () => {
		const base = "/experiences/art/create-art";
		const url = parent ? `${base}?parent=${parent}` : base;
		try {
			void router.push(url);
		} catch {
			window.location.href = url;
		}
	};

	return <FloatingButtonLayoutCreate onClick={handleFloatingClick}>{children}</FloatingButtonLayoutCreate>;
};

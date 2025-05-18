"use client";

import React from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import "./index.scss";

interface FloatingButtonLayoutProps {
	onClick?: () => void;
	children: React.ReactNode;
}

export const FloatingButtonLayoutCreate: React.FC<FloatingButtonLayoutProps> = ({
	onClick = () => {},
	children,
}) => (
	<div className="floating-button-layout__container">
		{children}
		<button
			type="button"
			onClick={onClick}
			className="
        floatingButton
        flex h-14 w-14
        items-center justify-center
        rounded-full
        text-white
        shadow-lg
        transition
        focus:outline-none focus:ring-2
        focus:ring-yellow-300
      "
			style={{ backgroundColor: "#fcc419" }}
		>
			<PlusIcon className="h-6 w-6" />
		</button>
	</div>
);

"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

import { useBaseURL } from "@/checkout/hooks/useBaseURL";
import { navigateToParentIfNeeded } from "@/lib/iframeBridge";

type ConditionalLinkProps = LinkProps &
	AnchorHTMLAttributes<HTMLAnchorElement> & {
		active: boolean;
		children: ReactNode;
	};

export function ConditionalLink({ active, href, children, ...rest }: ConditionalLinkProps) {
	const baseURL = useBaseURL();

	if (active) {
		return <a {...rest}>{children}</a>;
	}

	if (typeof href === "string" && href.startsWith("http")) {
		return (
			<a
				href={href}
				{...rest}
				onClick={(event) => {
					if (navigateToParentIfNeeded(href, baseURL)) {
						event.preventDefault();
					}
					rest.onClick?.(event);
				}}
			>
				{children}
			</a>
		);
	}

	return (
		<Link
			href={href}
			{...rest}
			onClick={(event) => {
				if (typeof href === "string" && navigateToParentIfNeeded(href, baseURL)) {
					event.preventDefault();
				}
				rest.onClick?.(event);
			}}
		>
			{children}
		</Link>
	);
}

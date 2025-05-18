import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ConditionalLinkProps = LinkProps &
	AnchorHTMLAttributes<HTMLAnchorElement> & {
		active: boolean;
		children: ReactNode;
	};

export function ConditionalLink({ active, href, children, ...rest }: ConditionalLinkProps) {
	if (active) {
		return <a {...rest}>{children}</a>;
	}
	return (
		<Link href={href} {...rest}>
			{children}
		</Link>
	);
}

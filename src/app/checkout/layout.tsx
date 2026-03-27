import { type ReactNode } from "react";
import { type Viewport } from "next";

export const metadata = {
	title: "Saleor Storefront example",
	description: "Starter pack for building performant e-commerce experiences with Saleor.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout(props: { children: ReactNode }) {
	return <main>{props.children}</main>;
}

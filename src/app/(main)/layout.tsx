import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import type { Metadata, Viewport } from "next";
import { Providers } from "./Providers";
import { Header } from "@/ui/components/nav/components/CustomMenu/Header";
import { DisclaimerCard } from "@/ui/components/DisclaimerBanner";
import "./index.scss";

export const metadata: Metadata = {
	title: "Kimani Marketplace",
	description: "Join Kimani Marketplace: a dedicated space for Real Estate, Luxury Goods, and Art listings.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	viewportFit: "cover",
	userScalable: false,
};

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<Providers>
			<Header />

			<div className="bg-gray flex min-h-screen flex-col text-white">
				<main className="flex-1">{children}</main>
			</div>

			<Toaster position="top-center" />
			<DisclaimerCard />
		</Providers>
	);
}

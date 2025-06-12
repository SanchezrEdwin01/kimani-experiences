import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Providers } from "./Providers";
import { Header } from "@/ui/components/nav/components/CustomMenu/Header";
import { DisclaimerCard } from "@/ui/components/DisclaimerBanner";
import "./index.scss";

export const metadata = {
	title: "Marketplace",
	description: "Starter pack for building performant e-commerce experiences with Saleor.",
};

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<Providers>
			<div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
				<Header />
			</div>
			<div className="bg-gray flex min-h-[calc(100dvh-64px)] flex-col text-white">
				<main className="flex-1">{children}</main>
			</div>
			<Toaster position="top-center" />
			<DisclaimerCard />
		</Providers>
	);
}

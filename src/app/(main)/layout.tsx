import { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "@/ui/components/nav/components/CustomMenu/Header/index";
import "./index.scss";

export const metadata = {
	title: "Saleor Storefront example",
	description: "Starter pack for building performant e-commerce experiences with Saleor.",
};

export default function MainLayout(props: { children: ReactNode }) {
	return (
		<>
			<div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
				<Header />
			</div>
			<div className="bg-gray flex min-h-[calc(100dvh-64px)] flex-col text-white">
				<main className="flex-1">{props.children}</main>
			</div>
			<Toaster position="top-center" />
		</>
	);
}

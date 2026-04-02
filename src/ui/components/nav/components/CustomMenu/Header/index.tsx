"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MenuOutline } from "styled-icons/evaicons-outline";
import { TabbedNavigation } from "../TabbedNavigation";
import { Dropdown } from "../Dropdown/index";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";
import "./index.scss";
import { useMarketplaceURL } from "@/checkout/hooks/useMarketplaceURL";
import { navigateToParentIfNeeded } from "@/lib/iframeBridge";

export function Header() {
	const router = useRouter();
	const baseURL = useBaseURL();
	const marketURL = useMarketplaceURL();
	const [activeTab, setActiveTab] = useState<string>("Experiences");

	const navigate = (path: string) => {
		if (path === "#") return;
		if (navigateToParentIfNeeded(path, baseURL)) return;
		if (path.startsWith("http")) {
			window.location.href = path;
			return;
		}
		router.push(path);
	};

	const buildSessionQuery = (originParam: "origin" | "native") => {
		if (typeof window === "undefined") return "";

		const params = new URLSearchParams();
		const token = localStorage.getItem("authToken");
		const sessionOrigin =
			localStorage.getItem("originAfterLogin") || localStorage.getItem("kimani_base_url") || baseURL;

		if (sessionOrigin) {
			params.set(originParam, sessionOrigin);
		}

		if (token) {
			params.set("token", token);
		}

		return params.toString();
	};

	const withSessionParams = (url: string, originParam: "origin" | "native") => {
		const query = buildSessionQuery(originParam);
		if (!query) return url;

		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}${query}`;
	};

	const tabs = [
		{ title: "Local", url: `${baseURL}/communities` },
		{ title: "Global", url: `${baseURL}/global` },
		{ title: "Events", url: withSessionParams(`${baseURL}/events`, "native") },
		{ title: "Experiences", url: "#" },
		{
			title: "Marketplace",
			url: withSessionParams(`${marketURL}/marketplace/portal`, "origin"),
		},
		{ title: "Concierge", url: `${baseURL}/concierge/request` },
		{ title: "Corporate", url: `${baseURL}/corporate` },
		{ title: "Resident", url: `${baseURL}/resident` },
	].map((tab) => ({
		title: tab.title,
		onClick: () => {
			setActiveTab(tab.title);
			navigate(tab.url);
		},
	}));

	return (
		<header className="header">
			<div className="hero">
				<div
					className="logo"
					onClick={() => navigate(`${baseURL}/communities`)}
					style={{ cursor: "pointer" }}
				>
					<Image
						src="https://community.kimanilife.com/assets/logo.webp"
						alt="Kimani Life"
						width={96}
						height={24}
					/>
				</div>

				<div className="menu">
					<div className="items">
						<MenuOutline size="30" />
					</div>
					<Dropdown />
				</div>
			</div>
			<TabbedNavigation tabs={tabs} active={activeTab} />
		</header>
	);
}

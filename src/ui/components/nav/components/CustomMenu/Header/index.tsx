"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MenuOutline } from "styled-icons/evaicons-outline";
import { TabbedNavigation } from "../TabbedNavigation";
import { Dropdown } from "../Dropdown/index";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";
import "./index.scss";

export function Header() {
	const router = useRouter();
	const baseURL = useBaseURL();
	const [activeTab, setActiveTab] = useState<string>("Marketplace");

	const navigate = (path: string) => {
		if (path.startsWith("http")) {
			window.location.href = path;
		} else {
			router.push(path);
		}
	};

	const tabs = [
		{ title: "Local", url: `${baseURL}/communities` },
		{ title: "Global", url: `${baseURL}/global` },
		{ title: "Events", url: `${baseURL}/events` },
		{ title: "Marketplace", url: `${baseURL}/experiences/real-estate` },
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

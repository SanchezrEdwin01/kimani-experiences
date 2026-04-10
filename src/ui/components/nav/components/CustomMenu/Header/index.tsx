"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuOutline } from "styled-icons/evaicons-outline";
import { TabbedNavigation } from "../TabbedNavigation";
import { Dropdown } from "../Dropdown/index";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";
import "./index.scss";
import { navigateToParentIfNeeded, isEmbeddedWindow } from "@/lib/iframeBridge";

const MARKETPLACE_PORTAL_URL =
	process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://marketplace.kimaniclub.com";

export function Header() {
	const router = useRouter();
	const baseURL = useBaseURL();
	const [activeTab, setActiveTab] = useState<string>("Experiences");

	// Returns true when the navigation was delegated to the parent app,
	// false when it stays within this portal.
	const navigate = (path: string): boolean => {
		if (path === "#") return false;
		if (navigateToParentIfNeeded(path, baseURL)) return true;
		if (path.startsWith("http")) {
			window.location.href = path;
			return false;
		}
		router.push(path);
		return false;
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

	// When running embedded in a KIMANI iframe, `${baseURL}/marketplace` is a
	// "signal URL": same origin as the parent, so navigateToParentIfNeeded sends
	// KIMANI_NAVIGATE to the parent which calls showFrame("marketplace").
	//
	// When running in the legacy Capacitor InAppBrowser (not embedded), there is
	// no parent to intercept the signal. We go directly to the marketplace portal
	// URL with the token already stored in localStorage — bypassing PortalRedirect
	// which has no session context yet and would redirect to login.
	const marketplaceUrl = isEmbeddedWindow()
		? `${baseURL}/marketplace`
		: withSessionParams(`${MARKETPLACE_PORTAL_URL}/marketplace/portal`, "origin");

	const tabs = [
		{ title: "Local", url: `${baseURL}/communities` },
		{ title: "Global", url: `${baseURL}/global` },
		{ title: "Events", url: withSessionParams(`${baseURL}/events`, "native") },
		{ title: "Experiences", url: "#" },
		{ title: "Marketplace", url: marketplaceUrl },
		{ title: "Concierge", url: `${baseURL}/concierge/request` },
		{ title: "Corporate", url: `${baseURL}/corporate` },
		{ title: "Resident", url: `${baseURL}/resident` },
	].map((tab) => ({
		title: tab.title,
		onClick: () => {
			// Only update the visual active tab when the user stays inside this portal.
			// When navigate() delegates to the parent the iframe will be hidden; keeping
			// the state at the portal's own name ensures it looks correct on return.
			if (!navigate(tab.url)) setActiveTab(tab.title);
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
					<img src="https://app.kimaniclub.com/assets/logo.webp" alt="Kimani Life" />
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

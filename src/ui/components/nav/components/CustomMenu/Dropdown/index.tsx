"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ConditionalLink } from "../ConditionalLink";
import menuIcon from "./link.png";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";

import "./index.scss";

type MenuItem = {
	key: string;
	label: string;
	path: string;
	disabled?: boolean;
};

export function Dropdown() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	const baseURL = useBaseURL();

	const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

	const navigate = (url: string) => {
		if (url.startsWith("http")) {
			window.location.href = url;
		} else {
			router.push(url);
		}
	};

	const items: MenuItem[] = [
		{ key: "benefits", label: "BENEFITS", path: "/benefits", disabled: true },
		{ key: "privileges", label: "PRIVILEGES", path: "/privileges", disabled: true },
		{ key: "ambassadors", label: "AMBASSADORS", path: "/ambassadors", disabled: true },
		{ key: "sponsors", label: "SPONSORS", path: "/sponsor", disabled: true },
		{ key: "corporate", label: "CORPORATE", path: "/corporate", disabled: true },
		// { key: "join-team", label: "JOIN OUR TEAM", path: "/hiring", disabled: true },
		{ key: "contact", label: "CONTACT US", path: "/contact", disabled: true },
		{ key: "about-us", label: "ABOUT US", path: "/about-us", disabled: true },
	];

	const renderItem = (item: MenuItem) => {
		const url = `${baseURL}${item.path}`;

		const content = (
			<div className={`option${item.disabled ? "" : ""}`} id={item.disabled ? "disabled" : undefined}>
				{item.label}
				<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
			</div>
		);

		if (item.disabled) {
			return (
				<div key={item.key} onClick={(e) => e.preventDefault()}>
					{content}
				</div>
			);
		}

		return (
			<button
				key={item.key}
				type="button"
				className="linkLikeButton"
				onClick={(e) => {
					e.stopPropagation();
					navigate(url);
				}}
			>
				{content}
			</button>
		);
	};

	return (
		<div id="dropdown" className={`dropdown ${isDropdownOpen ? "open" : ""}`} onClick={toggleDropdown}>
			<div className="selected-option" />

			<div className={`options-container ${isDropdownOpen ? "open" : ""}`}>
				<div className="options">
					<div className="spacer" />

					<ConditionalLink key="home" active={pathname === "/communities"} href={`${baseURL}/communities`}>
						<div className="option">
							HOME
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</ConditionalLink>

					{items.map(renderItem)}
				</div>
			</div>
		</div>
	);
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ConditionalLink } from "../ConditionalLink";
import menuIcon from "./link.png";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";

import "./index.scss";

type MenuItem = {
	key: string;
	label: string;
	path: string;
};

export function Dropdown() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const pathname = usePathname();
	const baseURL = useBaseURL();

	const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

	const items: MenuItem[] = [
		{ key: "benefits", label: "BENEFITS", path: "/benefits" },
		{ key: "privileges", label: "PRIVILEGES", path: "/privileges" },
		{ key: "ambassadors", label: "AMBASSADORS", path: "/ambassadors" },
		{ key: "sponsors", label: "SPONSORS", path: "/sponsor" },
		{ key: "corporate", label: "CORPORATE", path: "/corporate" },
		{ key: "contact", label: "CONTACT US", path: "/contact" },
		{ key: "about-us", label: "ABOUT US", path: "/about-us" },
	];

	const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

	return (
		<div id="dropdown" className={`dropdown ${isDropdownOpen ? "open" : ""}`} onClick={toggleDropdown}>
			<div className="selected-option" />

			<div
				className={`options-container ${isDropdownOpen ? "open" : ""}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="options">
					<div className="spacer" />

					{/* HOME */}
					<ConditionalLink key="home" active={pathname === "/communities"} href={`${baseURL}/communities`}>
						<div className="option">
							HOME
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</ConditionalLink>

					{items.map((item) => (
						<ConditionalLink key={item.key} active={isActive(item.path)} href={`${baseURL}${item.path}`}>
							<div className="option">
								{item.label}
								<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
							</div>
						</ConditionalLink>
					))}
				</div>
			</div>
		</div>
	);
}

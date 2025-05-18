"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ConditionalLink } from "../ConditionalLink";
import menuIcon from "./link.png";

import "./index.scss";

export function Dropdown() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const pathname = usePathname();

	const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

	return (
		<div id="dropdown" className={`dropdown ${isDropdownOpen ? "open" : ""}`} onClick={toggleDropdown}>
			<div className="selected-option" />

			<div className={`options-container ${isDropdownOpen ? "open" : ""}`}>
				<div className="options">
					<div className="spacer" />

					<ConditionalLink key="home" active={pathname === "/communities"} href="/communities">
						<div className="option">
							HOME
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</ConditionalLink>

					<a key="benefits" href="https://www.kimanilife.com/member-benefits-platform">
						<div className="option">
							BENEFITS
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</a>

					<a key="privileges" href="https://www.kimanilife.com/privileges">
						<div className="option">
							PRIVILEGES
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</a>

					<a key="ambassadors" href="https://www.kimanilife.com/ambassadors">
						<div id="disabled" className="option">
							AMBASSADORS
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</a>

					<a key="sponsors" href="https://www.kimanilife.com/sponsorship">
						<div id="disabled" className="option">
							SPONSORS
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</a>

					<a key="corporate" href="https://www.kimanilife.com/membership/corporate">
						<div id="disabled" className="option">
							CORPORATE
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</a>

					<a key="join-team" href="https://www.kimanilife.com/hiring">
						<div id="disabled" className="option">
							JOIN OUR TEAM
							<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
						</div>
					</a>

					<div className="menuWrap">
						<a key="contact" href="https://www.kimanilife.com/contact">
							<div className="option">
								CONTACT US
								<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
							</div>
						</a>
						<a key="about-us" href="https://www.kimanilife.com/about-us">
							<div className="option">
								ABOUT US
								<Image src={menuIcon} alt="menu icon" width={16} height={16} className="menuIcon" />
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

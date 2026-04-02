// src/kimani-footer-module/components/Footer.tsx
"use client";

import React, { memo } from "react";
import { HomeIcon, ChatBubbleLeftRightIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useUser } from "../../UserKimani/context/UserContext";
import styles from "./Footer.module.scss";
import { UserIcon } from "./UserIcon";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";
import { navigateToParentIfNeeded } from "@/lib/iframeBridge";

const FooterComponent = () => {
	const { user } = useUser();
	const BASE_URL = useBaseURL();
	const handleNavigate = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (navigateToParentIfNeeded(href, BASE_URL)) {
			event.preventDefault();
		}
	};

	return (
		<footer className={styles.footer}>
			<div className={styles.navigation}>
				<a href={`${BASE_URL}/`} onClick={handleNavigate(`${BASE_URL}/`)}>
					<button type="button">
						<HomeIcon height={24} aria-label="Home" />
						<span>Home</span>
					</button>
				</a>

				<a href={`${BASE_URL}/chat`} onClick={handleNavigate(`${BASE_URL}/chat`)}>
					<button type="button">
						<ChatBubbleLeftRightIcon height={24} aria-label="Chat" />
						<span>Chat</span>
					</button>
				</a>

				<a href={`${BASE_URL}/settings`} onClick={handleNavigate(`${BASE_URL}/settings`)}>
					<button type="button" className={styles.profileButton}>
						<UserIcon
							target={user}
							size={50}
							status={true}
							style={{
								marginTop: "-12px",
								background: "#020202",
								borderTopLeftRadius: "100%",
								borderTopRightRadius: "100%",
							}}
						/>
					</button>
				</a>

				<a href={`${BASE_URL}/friends`} onClick={handleNavigate(`${BASE_URL}/friends`)}>
					<button type="button">
						<UserGroupIcon height={24} aria-label="Friends" />
						<span>Friends</span>
					</button>
				</a>

				<a href={`${BASE_URL}/members`} onClick={handleNavigate(`${BASE_URL}/members`)}>
					<button type="button">
						<UserGroupIcon height={24} aria-label="Members" />
						<span>Members</span>
					</button>
				</a>
			</div>
		</footer>
	);
};

export const Footer = memo(FooterComponent);

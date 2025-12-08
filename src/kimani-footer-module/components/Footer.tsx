// src/kimani-footer-module/components/Footer.tsx
"use client";

import React, { memo } from "react";
import { HomeIcon, MagnifyingGlassIcon, UserPlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useUser } from "../../UserKimani/context/UserContext";
import styles from "./Footer.module.scss";
import { UserIcon } from "./UserIcon";
import { getStoredBaseUrl } from "@/UserKimani/lib/useUrlParamsProcessor";

const FooterComponent = () => {
	// Usa el contexto de usuario principal de la app (NO el store propio)
	const { user } = useUser();
	const BASE_URL = getStoredBaseUrl();

	return (
		<footer className={styles.footer}>
			<div className={styles.navigation}>
				<a href={`${BASE_URL}/`}>
					<button type="button">
						<HomeIcon height={24} aria-label="Home" />
						<span>Home</span>
					</button>
				</a>

				<a href={`${BASE_URL}/search`}>
					<button type="button">
						<MagnifyingGlassIcon height={24} aria-label="Search" />
						<span>Search</span>
					</button>
				</a>

				<a href={`${BASE_URL}/settings`}>
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

				<a href={`${BASE_URL}/friends`}>
					<button type="button">
						<UserPlusIcon height={24} aria-label="Friends" />
						<span>Friends</span>
					</button>
				</a>

				<a href={`${BASE_URL}/members`}>
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

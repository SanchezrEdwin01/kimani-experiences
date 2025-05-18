"use client";

import { useRouter } from "next/navigation";
import {
	TYPES,
	ADMIN_CATEGORY,
	MANAGE_PROVIDER,
	ART_CATEGORY_SLUG,
	ADMIN_ART_CATEGORIES_PAGE_VALUE,
	REAL_ESTATE_CATEGORY_SLUG,
	ADMIN_REAL_ESTATE_CATEGORIES_PAGE_VALUE,
	LUXURY_GOODS_CATEGORY_SLUG,
	ADMIN_LUXURY_GOODS_CATEGORIES_PAGE_VALUE,
} from "@/checkout/utils/constants";

interface SettingsMenuProps {
	open: boolean;
	sectionSlug?: string;
}

export const SettingsMenu = ({ open, sectionSlug }: SettingsMenuProps) => {
	const router = useRouter();
	const goToAdminCategory = () => {
		let routeValue = ADMIN_CATEGORY;
		if (sectionSlug === ART_CATEGORY_SLUG) {
			routeValue = ADMIN_ART_CATEGORIES_PAGE_VALUE;
		} else if (sectionSlug === REAL_ESTATE_CATEGORY_SLUG) {
			routeValue = ADMIN_REAL_ESTATE_CATEGORIES_PAGE_VALUE;
		} else if (sectionSlug === LUXURY_GOODS_CATEGORY_SLUG) {
			routeValue = ADMIN_LUXURY_GOODS_CATEGORIES_PAGE_VALUE;
		}
		const route = TYPES.find((type) => type.value === routeValue)?.route;
		if (route) {
			void router.push(`/${route}`);
		}
	};

	const goToManageProvider = () => {
		const route = TYPES.find((type) => type.value === MANAGE_PROVIDER)?.route;
		if (route) {
			void router.push(`/${route}`);
		}
	};
	return (
		<>
			{open && (
				<div
					className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-xl bg-[#212220] text-center
            shadow-lg md:absolute md:right-0 md:top-12 md:w-64 md:rounded-md md:rounded-t-none"
				>
					<div className="border-b border-gray-200 p-4 font-semibold text-white">Admin settings</div>
					<div className="flex flex-col p-2">
						{sectionSlug !== ART_CATEGORY_SLUG &&
							sectionSlug !== REAL_ESTATE_CATEGORY_SLUG &&
							sectionSlug !== LUXURY_GOODS_CATEGORY_SLUG && (
								<button
									className="rounded px-4 py-2 text-left text-white hover:bg-gray-700"
									onClick={goToManageProvider}
								>
									Manage service providers
								</button>
							)}
						<button
							className="rounded px-4 py-2 text-left text-white hover:bg-gray-700"
							onClick={goToAdminCategory}
						>
							Manage categories
						</button>
					</div>
				</div>
			)}
		</>
	);
};

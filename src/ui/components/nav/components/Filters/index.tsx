"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import classNames from "classnames";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { FilterModal } from "./FilterDetails/filterDetails";
import { TYPES, EVENT_TYPE_ALL, REAL_ESTATE_CATEGORY_SLUG } from "@/checkout/utils/constants";
import type { FiltersState } from "@/app/(main)/marketplace/real-estate/page";
import "./index.scss";

interface FiltersComponentProps {
	currentFilters: FiltersState;
	onSearchChange: (searchTerm: string) => void;
	onMainCategoryChange: (slug?: string) => void;
	onApplyModalFilters: (filters: {
		subCategorySlug?: string;
		priceRange?: { min: number; max: number };
		sort?: { field: "price" | "date"; direction: "asc" | "desc" };
	}) => void;
	onResetAllFilters: () => void;
	parentCategorySlug?: string;
	subCategoryOptions: { slug: string; name: string }[];
}

export function Filters({
	currentFilters,
	onSearchChange,
	onMainCategoryChange,
	onApplyModalFilters,
	onResetAllFilters,
	parentCategorySlug,
	subCategoryOptions,
}: FiltersComponentProps) {
	const router = useRouter();

	const pathname = usePathname();

	type TagUIType = { name: string; value: string; route?: string };
	type Tag = { name: string; value: string; route?: string };

	const [internalSearchValue, setInternalSearchValue] = useState<string>(currentFilters.search || "");
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		setInternalSearchValue(currentFilters.search || "");
	}, [currentFilters.search]);

	const debouncedSearch = useDebouncedCallback((val: string) => {
		onSearchChange(val);
	}, 700);

	const defaultTag: Tag = TYPES.find((tag) => tag.value === EVENT_TYPE_ALL) || {
		name: "All",
		value: EVENT_TYPE_ALL,
	};

	const selectedTag: Tag =
		TYPES.find((tag) => {
			if (!tag.route) return false;
			const normalizedRoute = tag.route.startsWith("/") ? tag.route : `/${tag.route}`;
			return pathname === normalizedRoute || pathname.startsWith(`${normalizedRoute}/`);
		}) || defaultTag;

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setInternalSearchValue(e.target.value);
		debouncedSearch(e.target.value);
	};

	const handleSelectedTag = (tag: TagUIType) => {
		if (tag.route && router) {
			router.push(tag.route.startsWith("/") ? tag.route : `/${tag.route}`);
		}
		onMainCategoryChange(tag.value);
	};

	const isAnyFilterActive = () => {
		return (
			currentFilters.search !== "" ||
			currentFilters.mainCategorySlug !== EVENT_TYPE_ALL ||
			currentFilters.subCategorySlug !== undefined ||
			currentFilters.location !== undefined ||
			currentFilters.priceRange.min !== 0 ||
			currentFilters.priceRange.max !== Infinity
		);
	};

	return (
		<div className="filters">
			<div className="search_bar">
				<div className="search_bar__container">
					<label htmlFor="search-input" className="search_bar__icon">
						<MagnifyingGlassIcon width={20} />
					</label>
					<input
						id="search-input"
						type="text"
						className="search-input"
						placeholder="Search services, products..."
						value={internalSearchValue}
						onChange={handleInputChange}
					/>
				</div>
				<button
					type="button"
					className="search_bar__funnel"
					aria-label="Toggle advanced filters"
					onClick={() => setShowModal(true)}
				>
					<AdjustmentsHorizontalIcon width={25} />
				</button>
				{isAnyFilterActive() && (
					<button
						type="button"
						onClick={onResetAllFilters}
						className="search_bar__reset ml-2 p-1 text-slate-400 hover:text-white"
						aria-label="Reset all filters"
					>
						<XCircleIcon width={25} />
					</button>
				)}

				<FilterModal
					isOpen={showModal}
					onClose={() => setShowModal(false)}
					currentFilters={currentFilters}
					onApply={onApplyModalFilters}
					categorySlugForModalLoad={
						parentCategorySlug === EVENT_TYPE_ALL ? REAL_ESTATE_CATEGORY_SLUG : parentCategorySlug
					}
					subCategoryOptions={subCategoryOptions}
				/>
			</div>

			<div className="tags">
				{TYPES.slice(0, 4).map((type, idx) => (
					<div
						key={idx}
						role="button"
						tabIndex={0}
						className={classNames("tag", {
							selected_tag: selectedTag.value === type.value,
						})}
						onClick={() => handleSelectedTag(type as Tag)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleSelectedTag(type as Tag);
							}
						}}
					>
						<span>{type.name}</span>
					</div>
				))}
			</div>
		</div>
	);
}

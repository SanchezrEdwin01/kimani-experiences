"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useDebouncedCallback } from "use-debounce";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { FilterModal } from "./FilterDetails/filterDetails";
import { EVENT_TYPE_ALL, REAL_ESTATE_CATEGORY_SLUG } from "@/checkout/utils/constants";
import type { FiltersState } from "@/app/(main)/experiences/page";
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
	onApplyModalFilters,
	onResetAllFilters,
	parentCategorySlug,
	subCategoryOptions,
}: FiltersComponentProps) {
	const [internalSearchValue, setInternalSearchValue] = useState<string>(currentFilters.search || "");
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		setInternalSearchValue(currentFilters.search || "");
	}, [currentFilters.search]);

	const debouncedSearch = useDebouncedCallback((val: string) => {
		onSearchChange(val);
	}, 700);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setInternalSearchValue(e.target.value);
		debouncedSearch(e.target.value);
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
						placeholder="Search experience..."
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
		</div>
	);
}

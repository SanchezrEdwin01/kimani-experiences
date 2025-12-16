"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useDebouncedCallback } from "use-debounce";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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

export function Filters({ currentFilters, onSearchChange }: FiltersComponentProps) {
	const [internalSearchValue, setInternalSearchValue] = useState<string>(currentFilters.search || "");
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
			</div>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./filter.scss";
import type { FiltersState } from "@/app/(main)/marketplace/real-estate/page";

interface FilterModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentFilters: FiltersState;
	onApply: (filters: {
		subCategorySlug?: string;
		priceRange?: { min: number; max: number };
		sort?: { field: "price" | "date"; direction: "asc" | "desc" };
	}) => void;
	categorySlugForModalLoad?: string;
	subCategoryOptions: { slug: string; name: string }[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
	isOpen,
	onClose,
	currentFilters,
	onApply,
	categorySlugForModalLoad,
	subCategoryOptions,
}) => {
	const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
		currentFilters.subCategorySlug || "",
	);
	const [minPrice, setMinPrice] = useState<string>(
		currentFilters.priceRange.min === 0 ? "" : String(currentFilters.priceRange.min),
	);
	const [maxPrice, setMaxPrice] = useState<string>(
		currentFilters.priceRange.max === Infinity ? "" : String(currentFilters.priceRange.max),
	);
	const [sortOption, setSortOption] = useState<string>(
		`${currentFilters.sort.field}-${currentFilters.sort.direction}`,
	);

	useEffect(() => {
		setSelectedSubCategory(currentFilters.subCategorySlug || "");
		setMinPrice(currentFilters.priceRange.min === 0 ? "" : String(currentFilters.priceRange.min));
		setMaxPrice(currentFilters.priceRange.max === Infinity ? "" : String(currentFilters.priceRange.max));
		setSortOption(`${currentFilters.sort.field}-${currentFilters.sort.direction}`);
	}, [currentFilters, isOpen]);

	useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleApplyClick = () => {
		const filtersToApply: {
			subCategorySlug?: string;
			priceRange?: { min: number; max: number };
			sort?: { field: "price" | "date"; direction: "asc" | "desc" };
		} = {};

		filtersToApply.subCategorySlug = selectedSubCategory !== "" ? selectedSubCategory : undefined;

		const numMinPrice = parseFloat(minPrice);
		const numMaxPrice = parseFloat(maxPrice);

		filtersToApply.priceRange = {
			min: isNaN(numMinPrice) || numMinPrice < 0 ? 0 : numMinPrice,
			max: isNaN(numMaxPrice) || numMaxPrice < 0 ? Infinity : numMaxPrice,
		};

		const [field, direction] = sortOption.split("-") as ["price" | "date", "asc" | "desc"];
		filtersToApply.sort = { field, direction };

		onApply(filtersToApply);
		onClose();
	};

	const handleClearModalFilters = () => {
		setSelectedSubCategory("");
		setMinPrice("");
		setMaxPrice("");
		setSortOption("price-asc");
		onApply({
			subCategorySlug: undefined,
			priceRange: { min: 0, max: Infinity },
			sort: { field: "price", direction: "asc" },
		});
	};

	return createPortal(
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<h2>Filters</h2>

				<div className="formGroup">
					<label htmlFor="category-select">Sub-Category</label>
					<select
						id="category-select"
						className="w-full max-w-full truncate rounded border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-white"
						value={selectedSubCategory}
						onChange={(e) => setSelectedSubCategory(e.target.value)}
					>
						<option value="">All in {categorySlugForModalLoad || "current selection"}</option>
						{subCategoryOptions.map((cat) => (
							<option key={cat.slug} value={cat.slug}>
								{cat.name}
							</option>
						))}
					</select>
				</div>

				<div className="filter-section">
					<label>Price range</label>
					<div className="price-range">
						<input
							type="number"
							placeholder="Min"
							value={minPrice}
							onChange={(e) => setMinPrice(e.target.value)}
						/>
						<input
							type="number"
							placeholder="Max"
							value={maxPrice}
							onChange={(e) => setMaxPrice(e.target.value)}
						/>
					</div>
				</div>

				<div className="filter-section">
					<label>Sort by</label>
					<select
						value={sortOption}
						onChange={(e) => setSortOption(e.target.value)}
						className="w-full max-w-full truncate rounded border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-white"
					>
						<option value="price-asc">Price: Low to high</option>
						<option value="price-desc">Price: High to low</option>
						<option value="date-desc">Date: Newest first</option>
						<option value="date-asc">Date: Oldest first</option>
					</select>
				</div>

				<div className="filter-actions">
					<button onClick={handleClearModalFilters} className="clear-btn">
						Clear Modal
					</button>
					<button onClick={handleApplyClick} className="apply-btn">
						Apply
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
};

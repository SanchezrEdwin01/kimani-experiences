/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { Filters } from "@/ui/components/nav/components/Filters";
import type { FiltersState } from "@/app/(main)/experiences/page";

interface MarketplaceControlsProps {
	currentFilters: FiltersState;
	onSearchChange: (term: string) => void;
	onMainCategoryChange: (slug?: string) => void;
	onApplyModalFilters: (filters: {
		subCategorySlug?: string;
		priceRange?: { min: number; max: number };
		sort?: { field: "price" | "date"; direction: "asc" | "desc" };
	}) => void;
	onResetAllFilters: () => void;
	subCategoryOptionsForModal: { slug: string; name: string }[];
}

export function MarketplaceControls({
	currentFilters,
	onSearchChange,
	onMainCategoryChange,
	onApplyModalFilters,
	onResetAllFilters,
	subCategoryOptionsForModal,
}: MarketplaceControlsProps) {
	return (
		<div
			style={{
				maxWidth: "100vw",
				overflowX: "hidden",
			}}
		>
			<Filters
				currentFilters={currentFilters}
				onSearchChange={onSearchChange}
				onMainCategoryChange={onMainCategoryChange}
				onApplyModalFilters={onApplyModalFilters}
				onResetAllFilters={onResetAllFilters}
				parentCategorySlug={currentFilters.mainCategorySlug}
				subCategoryOptions={subCategoryOptionsForModal}
			/>
		</div>
	);
}

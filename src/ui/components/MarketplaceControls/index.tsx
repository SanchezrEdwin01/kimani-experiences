"use client";

import { useState } from "react";
import type {
	ICountry as CountryStateCity_ICountry,
	ICity as CountryStateCity_ICity,
} from "country-state-city";
import { MarketplaceActions } from "@/ui/components/nav/components/MarketplaceActions";
import { Filters } from "@/ui/components/nav/components/Filters";
import { SettingsMenu } from "@/ui/components/nav/components/settingsAdmin/settings";
import type { FiltersState, SimpleCountry, SimpleCity } from "@/app/(main)/marketplace/real-estate/page";

interface MarketplaceControlsProps {
	sectionSlug?: string;
	currentFilters: FiltersState;
	onSearchChange: (term: string) => void;
	onLocationChange: (country?: SimpleCountry, city?: SimpleCity) => void;
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
	sectionSlug,
	currentFilters,
	onSearchChange,
	onLocationChange,
	onMainCategoryChange,
	onApplyModalFilters,
	onResetAllFilters,
	subCategoryOptionsForModal,
}: MarketplaceControlsProps) {
	const [showSettings, setShowSettings] = useState(false);

	const handleLocationChangeForActions = (
		country?: CountryStateCity_ICountry,
		city?: CountryStateCity_ICity,
	) => {
		if (!country) {
			onLocationChange();
			return;
		}
		const simpleCountry: SimpleCountry = { name: country.name, isoCode: country.isoCode };
		const simpleCity: SimpleCity | undefined = city ? { name: city.name } : undefined;
		onLocationChange(simpleCountry, simpleCity);
	};

	return (
		<>
			<MarketplaceActions
				onSettingsClick={() => setShowSettings(!showSettings)}
				onLocationChange={handleLocationChangeForActions}
				currentLocation={currentFilters.location}
			/>
			<SettingsMenu open={showSettings} sectionSlug={sectionSlug} />
			<Filters
				currentFilters={currentFilters}
				onSearchChange={onSearchChange}
				onMainCategoryChange={onMainCategoryChange}
				onApplyModalFilters={onApplyModalFilters}
				onResetAllFilters={onResetAllFilters}
				parentCategorySlug={currentFilters.mainCategorySlug}
				subCategoryOptions={subCategoryOptionsForModal}
			/>
		</>
	);
}

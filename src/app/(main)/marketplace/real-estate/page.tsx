"use client";

import { useEffect, useState, useMemo } from "react";
import { ConsoleNav, type Tab } from "@/ui/components/ConsoleNav";
import { MarketplaceControls } from "@/ui/components/MarketplaceControls";
import {
	ProductListByCategoryUniqueDocument,
	type ProductListByCategoryUniqueQuery,
	type ProductListByCategoryUniqueQueryVariables,
	type ProductListItemNoReviewsFragment,
	ProductListByCategoryByUserDocument,
	type ProductListByCategoryByUserQuery,
	type ProductListByCategoryByUserQueryVariables,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { ClickableProductList } from "@/ui/components/nav/components/RealState/product-details/ClickableProductList";
import { Loader } from "@/ui/atoms/Loader";
import { REAL_ESTATE_CATEGORY_SLUG, EVENT_TYPE_ALL } from "@/checkout/utils/constants";
import { ClientFloatingWrapperReal } from "@/ui/components/nav/components/RealState/FloatButton/FloatingWrapper";
import { FluidHideOnScrollHeader } from "@/ui/components/FluidHideOnScrollHeader";

export interface SimpleCountry {
	name: string;
	isoCode: string;
}
export interface SimpleCity {
	name: string;
}

export type FiltersState = {
	search: string;
	location?: { country: string; city?: string };
	mainCategorySlug?: string;
	subCategorySlug?: string;
	priceRange: { min: number; max: number };
	sort: { field: "price" | "date"; direction: "asc" | "desc" };
};

export default function CategoryProductsClientPage() {
	const [list, setList] = useState<ProductListItemNoReviewsFragment[]>([]);
	const [filtered, setFiltered] = useState<ProductListItemNoReviewsFragment[]>([]);
	const [filters, setFilters] = useState<FiltersState>({
		search: "",
		mainCategorySlug: EVENT_TYPE_ALL,
		priceRange: { min: 0, max: Infinity },
		sort: { field: "price", direction: "asc" },
	});
	const [activeTab, setActiveTab] = useState<Tab>("explore");
	const userId = "0";
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);

		if (activeTab === "explore") {
			executeGraphQL<ProductListByCategoryUniqueQuery, ProductListByCategoryUniqueQueryVariables>(
				ProductListByCategoryUniqueDocument,
				{ variables: { slug: REAL_ESTATE_CATEGORY_SLUG } },
			)
				.then(({ category }) => {
					const nodes =
						category?.products?.edges
							.map((e) => e?.node)
							.filter((n): n is ProductListItemNoReviewsFragment => !!n) ?? [];
					setList(nodes);
				})
				.catch((err) => console.error("Error fetching all products:", err))
				.finally(() => setLoading(false));
		} else if (activeTab === "myposts") {
			executeGraphQL<ProductListByCategoryByUserQuery, ProductListByCategoryByUserQueryVariables>(
				ProductListByCategoryByUserDocument,
				{ variables: { slug: REAL_ESTATE_CATEGORY_SLUG, userId } },
			)
				.then(({ category }) => {
					const nodes =
						category?.products?.edges
							.map((e) => e?.node)
							.filter((n): n is ProductListItemNoReviewsFragment => !!n) ?? [];
					setList(nodes);
				})
				.catch((err) => console.error("Error fetching my posts:", err))
				.finally(() => setLoading(false));
		} else {
			setList([]);
			setLoading(false);
		}
	}, [activeTab, userId]);

	const subCategoryOptionsForModal = useMemo(() => {
		const map = new Map<string, string>();
		let productsToConsider = list;
		if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
			productsToConsider = list.filter((p) => {
				let currentCategory = p.category as typeof p.category & { parent?: typeof p.category };
				while (currentCategory?.parent) {
					currentCategory = currentCategory.parent;
				}
				return currentCategory?.slug === filters.mainCategorySlug;
			});
		}

		productsToConsider.forEach((p) => {
			if (p.category?.slug && p.category.name) {
				map.set(p.category.slug, p.category.name);
			}
		});
		return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
	}, [list, filters.mainCategorySlug]);

	useEffect(() => {
		let tmp = [...list];

		if (filters.search) {
			const term = filters.search.toLowerCase();
			tmp = tmp.filter((p) => p.name.toLowerCase().includes(term));
		}

		if (filters.location && filters.location.country) {
			tmp = tmp.filter((p) => {
				const productCountryName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "country")
					?.values[0]?.name;
				const productCityName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "city")
					?.values[0]?.name;

				const filterCountryName = filters.location!.country;
				const filterCityName = filters.location!.city;

				const countryMatch = productCountryName?.toLowerCase() === filterCountryName.toLowerCase();
				if (filterCityName) {
					const cityMatch = productCityName?.toLowerCase() === filterCityName.toLowerCase();
					return cityMatch && countryMatch;
				}
				return countryMatch;
			});
		}

		if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
			tmp = tmp.filter((p) => {
				let productCategory = p.category as typeof p.category & { parent?: typeof p.category };
				while (
					productCategory &&
					"parent" in productCategory &&
					productCategory.parent &&
					typeof productCategory.parent === "object" &&
					productCategory.parent !== null &&
					"slug" in productCategory.parent
				) {
					productCategory = productCategory.parent;
				}
				return productCategory?.slug === filters.mainCategorySlug;
			});
		}

		if (filters.subCategorySlug) {
			tmp = tmp.filter((p) => p.category?.slug === filters.subCategorySlug);
		}

		tmp = tmp.filter((p) => {
			const price = p.pricing?.priceRange?.start?.gross.amount ?? 0;
			return price >= filters.priceRange.min && price <= filters.priceRange.max;
		});

		tmp.sort((a, b) => {
			if (filters.sort.field === "price") {
				const pa = a.pricing?.priceRange?.start?.gross.amount ?? 0;
				const pb = b.pricing?.priceRange?.start?.gross.amount ?? 0;
				return filters.sort.direction === "asc" ? pa - pb : pb - pa;
			}
			return 0;
		});

		setFiltered(tmp);
	}, [list, filters]);

	const handleSearchChange = (term: string) => {
		setFilters((f) => ({ ...f, search: term }));
	};

	const handleLocationChange = (country?: SimpleCountry, city?: SimpleCity) => {
		if (!country) {
			setFilters((f) => ({ ...f, location: undefined }));
		} else {
			setFilters((f) => ({
				...f,
				location: city ? { country: country.name, city: city.name } : { country: country.name },
			}));
		}
	};

	const handleMainCategoryChange = (slug?: string) => {
		setFilters((f) => ({
			...f,
			mainCategorySlug: slug === EVENT_TYPE_ALL ? EVENT_TYPE_ALL : slug,
			subCategorySlug: undefined,
			location:
				f.mainCategorySlug !== (slug === EVENT_TYPE_ALL ? EVENT_TYPE_ALL : slug) ? undefined : f.location,
		}));
	};

	const handleModalFiltersApply = (modalFilters: {
		subCategorySlug?: string;
		priceRange?: { min: number; max: number };
		sort?: { field: "price" | "date"; direction: "asc" | "desc" };
	}) => {
		setFilters((f) => ({
			...f,
			subCategorySlug: modalFilters.subCategorySlug !== "" ? modalFilters.subCategorySlug : undefined,
			priceRange: modalFilters.priceRange || f.priceRange,
			sort: modalFilters.sort || f.sort,
		}));
	};

	const resetAllFilters = () => {
		setFilters({
			search: "",
			mainCategorySlug: EVENT_TYPE_ALL,
			subCategorySlug: undefined,
			location: undefined,
			priceRange: { min: 0, max: Infinity },
			sort: { field: "price", direction: "asc" },
		});
	};

	const shown = activeTab === "saved" ? [] : filtered;

	return (
		<div className="min-h-screen pb-24">
			<FluidHideOnScrollHeader>
				<MarketplaceControls
					sectionSlug={REAL_ESTATE_CATEGORY_SLUG}
					currentFilters={filters}
					onSearchChange={handleSearchChange}
					onLocationChange={handleLocationChange}
					onMainCategoryChange={handleMainCategoryChange}
					onApplyModalFilters={handleModalFiltersApply}
					onResetAllFilters={resetAllFilters}
					subCategoryOptionsForModal={subCategoryOptionsForModal}
				/>

				<ConsoleNav activeTab={activeTab} onTabChange={setActiveTab} />
			</FluidHideOnScrollHeader>
			{loading ? (
				<div className="flex h-64 items-center justify-center">
					<Loader />
				</div>
			) : (
				<ClientFloatingWrapperReal>
					<ClickableProductList
						products={shown}
						categoryName={
							filters.subCategorySlug ||
							(filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL
								? filters.mainCategorySlug
								: REAL_ESTATE_CATEGORY_SLUG)
						}
					/>
				</ClientFloatingWrapperReal>
			)}
		</div>
	);
}

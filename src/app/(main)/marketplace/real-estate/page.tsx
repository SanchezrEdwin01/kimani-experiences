"use client";

import { useEffect, useState, useMemo } from "react";
import { ConsoleNav, type Tab } from "@/ui/components/ConsoleNav";
import { MarketplaceControls } from "@/ui/components/MarketplaceControls";
import {
	ProductListByCategoryUniqueDocument,
	type ProductListByCategoryUniqueQuery,
	type ProductListByCategoryUniqueQueryVariables,
	type ProductListItemNoReviewsFragment,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { ClickableProductList } from "@/ui/components/nav/components/RealState/product-details/ClickableProductList";
import { Loader } from "@/ui/atoms/Loader";
import { REAL_ESTATE_CATEGORY_SLUG, EVENT_TYPE_ALL } from "@/checkout/utils/constants";
import { ClientFloatingWrapperReal } from "@/ui/components/nav/components/RealState/FloatButton/FloatingWrapper";

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
	const [allProducts, setAllProducts] = useState<ProductListItemNoReviewsFragment[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<ProductListItemNoReviewsFragment[]>([]);
	const [filters, setFilters] = useState<FiltersState>({
		search: "",
		mainCategorySlug: EVENT_TYPE_ALL,
		priceRange: { min: 0, max: Infinity },
		sort: { field: "price", direction: "asc" },
	});
	const [activeTab, setActiveTab] = useState<Tab>("explore");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchProducts() {
			setLoading(true);
			try {
				const { category } = await executeGraphQL<
					ProductListByCategoryUniqueQuery,
					ProductListByCategoryUniqueQueryVariables
				>(ProductListByCategoryUniqueDocument, {
					variables: { slug: REAL_ESTATE_CATEGORY_SLUG },
				});
				const nodes =
					category?.products?.edges
						.map((e) => e?.node)
						.filter((n): n is ProductListItemNoReviewsFragment => !!n) ?? [];
				setAllProducts(nodes);
			} catch (err) {
				console.error("Failed to fetch products:", err);
			} finally {
				setLoading(false);
			}
		}
		void fetchProducts();
	}, []);

	const subCategoryOptionsForModal = useMemo(() => {
		const map = new Map<string, string>();
		let productsToConsider = allProducts;
		if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
			productsToConsider = allProducts.filter((p) => {
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
	}, [allProducts, filters.mainCategorySlug]);

	useEffect(() => {
		let tmp = [...allProducts];

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
			// if (filters.sort.field === "date") {
			//     const dateA: number = new Date(
			//         (a.attributes.find((attr) => attr.attribute.name?.toLowerCase() === 'publication_date')?.values[0]?.value) ||
			//         (a as any).created ||
			//         0
			//     ).getTime();

			//     const dateB: number = new Date(
			//         (b.attributes.find((attr) => attr.attribute.name?.toLowerCase() === 'publication_date')?.values[0]?.value) ||
			//         (b as any).created ||
			//         0
			//     ).getTime();

			//     return filters.sort.direction === "asc" ? dateA - dateB : dateB - dateA;
			// }
			return 0;
		});

		setFilteredProducts(tmp);
	}, [allProducts, filters]);

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

	const shown = activeTab === "explore" ? filteredProducts : activeTab === "saved" ? [] : filteredProducts;

	return (
		<div className="min-h-screen pb-24">
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

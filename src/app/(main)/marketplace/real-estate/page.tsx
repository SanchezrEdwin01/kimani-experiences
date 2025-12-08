//src/app/(main)/marketplace/real-estate/page.tsx
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
import { useUser } from "@/UserKimani/context/UserContext";
import { type User } from "@/UserKimani/types";
import { executeGraphQL } from "@/lib/graphql";
import { ClickableProductList } from "@/ui/components/nav/components/RealState/product-details/ClickableProductList";
import { Loader } from "@/ui/atoms/Loader";
import { REAL_ESTATE_CATEGORY_SLUG, EVENT_TYPE_ALL } from "@/checkout/utils/constants";
import { ClientFloatingWrapperReal } from "@/ui/components/nav/components/RealState/FloatButton/FloatingWrapper";
import { FluidHideOnScrollHeader } from "@/ui/components/FluidHideOnScrollHeader";
import { Footer } from "@/kimani-footer-module";

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
	const [filtered, setFiltered] = useState<ProductListItemNoReviewsFragment[]>([]);
	const { user, isLoading } = useUser();
	const [filters, setFilters] = useState<FiltersState>({
		search: "",
		mainCategorySlug: EVENT_TYPE_ALL,
		priceRange: { min: 0, max: Infinity },
		sort: { field: "price", direction: "asc" },
	});
	const [activeTab, setActiveTab] = useState<Tab>("explore");
	const userId = user?._id ?? "";
	const [loading, setLoading] = useState(true);
	const [baseList, setBaseList] = useState<ProductListItemNoReviewsFragment[]>([]);
	const [fetchedExplore, setFetchedExplore] = useState(false);
	const [fetchedMyPosts, setFetchedMyPosts] = useState(false);

	const handleTabChange = (tab: Tab) => {
		setFiltered([]);
		setBaseList([]);
		setFetchedExplore(false);
		setFetchedMyPosts(false);
		setActiveTab(tab);
	};

	const subCategoryOptionsForModal = useMemo(() => {
		const map = new Map<string, string>();
		let productsToConsider = filtered;
		if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
			productsToConsider = filtered.filter((p) => {
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
	}, [filtered, filters.mainCategorySlug]);

	useEffect(() => {
		if (activeTab === "explore") {
			if (!fetchedExplore) {
				setLoading(true);
				void executeGraphQL<ProductListByCategoryUniqueQuery, ProductListByCategoryUniqueQueryVariables>(
					ProductListByCategoryUniqueDocument,
					{ variables: { slug: REAL_ESTATE_CATEGORY_SLUG } },
				)
					.then(({ category }) => {
						const nodes =
							category?.products?.edges
								.map((e) => e?.node)
								.filter((n): n is ProductListItemNoReviewsFragment => !!n) ?? [];
						setBaseList(nodes);
						setFetchedExplore(true);
					})
					.catch(console.error)
					.finally(() => setLoading(false));
				return;
			}

			let tmp = [...baseList];
			if (filters.search) {
				const term = filters.search.toLowerCase();
				tmp = tmp.filter((p) => p.name.toLowerCase().includes(term));
			}
			if (filters.location?.country) {
				tmp = tmp.filter((p) => {
					const countryName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "country")
						?.values?.[0]?.name;
					const cityName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "city")?.values?.[0]
						?.name;
					const countryMatch = countryName?.toLowerCase() === filters.location!.country.toLowerCase();
					if (filters.location!.city) {
						return countryMatch && cityName?.toLowerCase() === filters.location!.city.toLowerCase();
					}
					return countryMatch;
				});
			}
			if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
				tmp = tmp.filter((p) => {
					let cat = p.category as typeof p.category & { parent?: typeof p.category };
					while (cat?.parent) {
						cat = cat.parent;
					}
					return cat?.slug === filters.mainCategorySlug;
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
				const pa = a.pricing?.priceRange?.start?.gross.amount ?? 0;
				const pb = b.pricing?.priceRange?.start?.gross.amount ?? 0;
				return filters.sort.direction === "asc" ? pa - pb : pb - pa;
			});

			setFiltered(tmp);
			return;
		}

		if (activeTab === "saved" && user) {
			if (!fetchedExplore) {
				setLoading(true);
				void executeGraphQL<ProductListByCategoryUniqueQuery, ProductListByCategoryUniqueQueryVariables>(
					ProductListByCategoryUniqueDocument,
					{ variables: { slug: REAL_ESTATE_CATEGORY_SLUG } },
				)
					.then(({ category }) => {
						const nodes =
							category?.products?.edges
								.map((e) => e?.node)
								.filter((n): n is ProductListItemNoReviewsFragment => !!n) ?? [];
						setBaseList(nodes);
						setFetchedExplore(true);
					})
					.catch(console.error)
					.finally(() => setLoading(false));
				return;
			}

			let tmp = baseList.filter((p) => {
				const entry = p.metadata?.find((m) => m.key === "favorites");
				if (!entry) return false;
				try {
					const favs = JSON.parse(entry.value) as User[];
					return favs.some((u) => u._id === user._id);
				} catch {
					return false;
				}
			});

			if (filters.search) {
				const term = filters.search.toLowerCase();
				tmp = tmp.filter((p) => p.name.toLowerCase().includes(term));
			}
			if (filters.location?.country) {
				tmp = tmp.filter((p) => {
					const countryName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "country")
						?.values?.[0]?.name;
					const cityName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "city")?.values?.[0]
						?.name;
					const countryMatch = countryName?.toLowerCase() === filters.location!.country.toLowerCase();
					if (filters.location!.city) {
						return countryMatch && cityName?.toLowerCase() === filters.location!.city.toLowerCase();
					}
					return countryMatch;
				});
			}
			if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
				tmp = tmp.filter((p) => {
					let cat = p.category as typeof p.category & { parent?: typeof p.category };
					while (cat?.parent) {
						cat = cat.parent;
					}
					return cat?.slug === filters.mainCategorySlug;
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
				const pa = a.pricing?.priceRange?.start?.gross.amount ?? 0;
				const pb = b.pricing?.priceRange?.start?.gross.amount ?? 0;
				return filters.sort.direction === "asc" ? pa - pb : pb - pa;
			});

			setFiltered(tmp);
			return;
		}

		if (activeTab === "myposts" && user && !isLoading) {
			if (!fetchedMyPosts) {
				setLoading(true);
				void executeGraphQL<ProductListByCategoryByUserQuery, ProductListByCategoryByUserQueryVariables>(
					ProductListByCategoryByUserDocument,
					{ variables: { slug: REAL_ESTATE_CATEGORY_SLUG, userId } },
				)
					.then(({ category }) => {
						const nodes =
							category?.products?.edges
								.map((e) => e?.node)
								.filter((n): n is ProductListItemNoReviewsFragment => !!n) ?? [];
						setBaseList(nodes);
						setFetchedMyPosts(true);
					})
					.catch(console.error)
					.finally(() => setLoading(false));
				return;
			}

			let tmp = [...baseList];
			if (filters.search) {
				const term = filters.search.toLowerCase();
				tmp = tmp.filter((p) => p.name.toLowerCase().includes(term));
			}
			if (filters.location?.country) {
				tmp = tmp.filter((p) => {
					const countryName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "country")
						?.values?.[0]?.name;
					const cityName = p.attributes.find((a) => a.attribute.name?.toLowerCase() === "city")?.values?.[0]
						?.name;
					const countryMatch = countryName?.toLowerCase() === filters.location!.country.toLowerCase();
					if (filters.location!.city) {
						return countryMatch && cityName?.toLowerCase() === filters.location!.city.toLowerCase();
					}
					return countryMatch;
				});
			}
			if (filters.mainCategorySlug && filters.mainCategorySlug !== EVENT_TYPE_ALL) {
				tmp = tmp.filter((p) => {
					let cat = p.category as typeof p.category & { parent?: typeof p.category };
					while (cat?.parent) {
						cat = cat.parent;
					}
					return cat?.slug === filters.mainCategorySlug;
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
				const pa = a.pricing?.priceRange?.start?.gross.amount ?? 0;
				const pb = b.pricing?.priceRange?.start?.gross.amount ?? 0;
				return filters.sort.direction === "asc" ? pa - pb : pb - pa;
			});

			setFiltered(tmp);
			return;
		}

		setFiltered([]);
	}, [activeTab, baseList, filters, user, isLoading, userId, fetchedExplore, fetchedMyPosts]);

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
				<ConsoleNav activeTab={activeTab} onTabChange={handleTabChange} />
			</FluidHideOnScrollHeader>

			{loading ? (
				<div className="flex h-64 items-center justify-center">
					<Loader />
				</div>
			) : (
				<ClientFloatingWrapperReal>
					<ClickableProductList
						products={filtered}
						categoryName={
							filters.subCategorySlug ||
							(filters.mainCategorySlug !== EVENT_TYPE_ALL
								? filters.mainCategorySlug
								: REAL_ESTATE_CATEGORY_SLUG) ||
							"Default Category"
						}
					/>
					<Footer />
				</ClientFloatingWrapperReal>
			)}
		</div>
	);
}

"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { FloatingButtonExperiences } from "../FloatButton/floatButton";
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
import { Loader } from "@/ui/atoms/Loader";
import { EXPERIENCES_CATEGORY_SLUG, EVENT_TYPE_ALL } from "@/checkout/utils/constants";
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

// Componente ExperienceCard
function ExperienceCard({
	product,
	currentUserId,
}: {
	product: ProductListItemNoReviewsFragment;
	currentUserId?: string;
}) {
	const router = useRouter();
	const thumbnailUrl = product.thumbnail?.url || "/placeholder-image.jpg";
	const thumbnailAlt = product.thumbnail?.alt || product.name;

	// Parsear descripción de EditorJS
	function parseEditorJSDescription(description: string | null | undefined): string {
		if (!description) return "No description available";

		try {
			const parsed = JSON.parse(description) as {
				blocks?: Array<{ type: string; data?: { text?: string } }>;
			};

			if (parsed.blocks && Array.isArray(parsed.blocks)) {
				const textBlocks = parsed.blocks
					.filter((block) => block.type === "paragraph" && block.data?.text)
					.map((block) => block.data?.text || "")
					.join(" ");

				const cleanText = textBlocks.replace(/<[^>]*>/g, "");
				return cleanText || "No description available";
			}

			if (typeof parsed === "string") {
				return parsed;
			}

			return "No description available";
		} catch {
			return description;
		}
	}

	const description = parseEditorJSDescription(product.description);

	// Atributos que NO queremos mostrar
	const HIDDEN_ATTRIBUTES = ["user id", "userid", "phone", "phone number", "phonenumber", "email", "e-mail"];

	// Filtrar atributos sensibles
	const visibleAttributes = product.attributes?.filter((attr) => {
		const attrName = attr.attribute.name?.toLowerCase() || "";
		return !HIDDEN_ATTRIBUTES.some((hidden) => attrName.includes(hidden));
	});

	// Verificar si el usuario actual es el dueño de la experiencia
	const isOwner = useMemo(() => {
		if (!currentUserId) return false;

		const userIdAttribute = product.attributes?.find(
			(attr) => attr.attribute.name?.toLowerCase() === "user id",
		)?.values?.[0]?.name;

		return userIdAttribute === currentUserId;
	}, [product, currentUserId]);

	const handleContactClick = () => {
		console.log("Contact clicked for:", product.name);
	};

	const handleEditClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		router.push(`/experiences/edit-experience/${product.slug}`);
	};

	return (
		<div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-zinc-700">
			{/* Imagen */}
			<div className="relative w-full overflow-hidden">
				<div className="relative aspect-[2/1] w-full">
					<Image
						src={thumbnailUrl}
						alt={thumbnailAlt}
						fill
						className="object-cover transition-transform duration-300 hover:scale-105"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
					/>

					<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

					<div className="absolute bottom-0 left-0 right-0 p-4">
						<h3 className="line-clamp-1 text-lg font-semibold text-white sm:text-xl">{product.name}</h3>
					</div>
				</div>
			</div>

			{/* Descripción y contenido */}
			<div className="flex flex-grow flex-col p-4 sm:p-5">
				<p className="mb-4 line-clamp-3 text-base leading-relaxed text-gray-300 sm:text-lg">{description}</p>

				{visibleAttributes && visibleAttributes.length > 0 && (
					<div className="mb-5 mt-4 flex flex-wrap gap-2">
						{visibleAttributes.slice(0, 3).map((attr, idx) => {
							const value = attr.values?.[0]?.name;
							if (!value) return null;
							return (
								<span
									key={idx}
									className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-gray-400"
								>
									{attr.attribute.name}: {value}
								</span>
							);
						})}
					</div>
				)}

				{/* Botones - Contact izquierda, Edit derecha */}
				<div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4">
					<button
						onClick={handleContactClick}
						className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition-all duration-200 hover:bg-gray-100 hover:shadow-lg"
					>
						Contact
					</button>

					{isOwner ? (
						<button
							onClick={handleEditClick}
							className="rounded-lg bg-blue-600 p-2 transition-colors hover:bg-blue-700"
							title="Edit Experience"
						>
							<PencilSquareIcon className="h-6 w-6 text-white" />
						</button>
					) : (
						<div className="text-sm text-gray-400">Posted by owner</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Grid de experiencias
function ExperiencesGrid({
	products,
	currentUserId,
}: {
	products: ProductListItemNoReviewsFragment[];
	currentUserId?: string;
}) {
	if (products.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center text-center">
				<div className="mb-2 text-lg text-gray-400">No experiences found</div>
				<p className="text-sm text-gray-500">Create your first experience to get started</p>
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-6 lg:px-8">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{products.map((product) => (
					<ExperienceCard key={product.id} product={product} currentUserId={currentUserId} />
				))}
			</div>
		</div>
	);
}

export default function ExperiencesClientPage() {
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
	const [fetchedExplore, setFetchedExplore] = useState(false);
	const [fetchedMyPosts, setFetchedMyPosts] = useState(false);
	const [baseList, setBaseList] = useState<ProductListItemNoReviewsFragment[]>([]);

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
		// --- EXPLORE TAB (todas las experiencias) ---
		if (activeTab === "explore") {
			if (!fetchedExplore) {
				setLoading(true);
				void executeGraphQL<ProductListByCategoryUniqueQuery, ProductListByCategoryUniqueQueryVariables>(
					ProductListByCategoryUniqueDocument,
					{ variables: { slug: EXPERIENCES_CATEGORY_SLUG } },
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

		// --- FAVORITOS / SAVED ---
		if (activeTab === "saved" && user) {
			if (!fetchedExplore) {
				setLoading(true);
				void executeGraphQL<ProductListByCategoryUniqueQuery, ProductListByCategoryUniqueQueryVariables>(
					ProductListByCategoryUniqueDocument,
					{ variables: { slug: EXPERIENCES_CATEGORY_SLUG } },
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

		// --- MIS POSTS / MYPOSTS ---
		if (activeTab === "myposts" && user && !isLoading) {
			if (!fetchedMyPosts) {
				setLoading(true);
				void executeGraphQL<ProductListByCategoryByUserQuery, ProductListByCategoryByUserQueryVariables>(
					ProductListByCategoryByUserDocument,
					{ variables: { slug: EXPERIENCES_CATEGORY_SLUG, userId } },
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
		<div className="min-h-screen bg-black pb-24">
			<FluidHideOnScrollHeader>
				<MarketplaceControls
					sectionSlug={EXPERIENCES_CATEGORY_SLUG}
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
				<>
					{/* Encabezado con estadísticas y botón flotante integrado */}
					<div className="mb-6 mt-6 px-4 sm:px-6 lg:px-8">
						<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
							<div>
								<h2 className="text-2xl font-bold text-white">
									{activeTab === "explore"
										? "All Experiences"
										: activeTab === "saved"
										? "My Saved Experiences"
										: "My Experiences"}
								</h2>
								<p className="mt-1 text-gray-400">
									{filtered.length} {filtered.length === 1 ? "experience" : "experiences"} found
								</p>
							</div>

							<div className="flex items-center gap-4">
								{user && (
									<div className="hidden text-sm text-gray-400 sm:block">
										Welcome back, <span className="text-white">{user.username}</span>
									</div>
								)}
								<FloatingButtonExperiences>
									<div className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20">
										<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
										Create Experience
									</div>
								</FloatingButtonExperiences>
							</div>
						</div>
					</div>

					{/* Grid de experiencias */}
					<ExperiencesGrid products={filtered} currentUserId={userId} />
				</>
			)}

			<Footer />
		</div>
	);
}

// src/utils/buildFilter.ts

export function buildFilter({
	categories,
	minPrice,
	maxPrice,
	countrySlug,
	citySlug,
	searchTerm,
}: {
	categories: string[];
	minPrice?: number;
	maxPrice?: number;
	countrySlug?: string;
	citySlug?: string;
	searchTerm?: string;
}) {
	const filter: Record<string, any> = {};

	if (categories?.length) {
		filter.categories = categories;
	}

	if (minPrice != null || maxPrice != null) {
		filter.price = {
			...(minPrice != null ? { gte: minPrice } : {}),
			...(maxPrice != null ? { lte: maxPrice } : {}),
		};
	}

	const attrs: { slug: string; values: string[] }[] = [];
	if (countrySlug) {
		attrs.push({ slug: "country", values: [countrySlug] });
	}
	if (citySlug) {
		attrs.push({ slug: "city", values: [citySlug] });
	}
	if (attrs.length) {
		filter.attributes = attrs;
	}

	if (searchTerm) {
		filter.search = searchTerm;
	}

	return filter;
}

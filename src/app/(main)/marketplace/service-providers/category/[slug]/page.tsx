import React from "react";
import { SubCategory } from "@/ui/components/nav/components/Categories/SubCategory/subCategory";
import { CustomHeaderMessage } from "@/ui/components/nav/components/CustomHeaderMessage";
import {
	ProductListByCategoryUniqueDocument,
	type ProductListByCategoryUniqueQuery,
	type ProductListByCategoryUniqueQueryVariables,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

async function getCategoryName(slug: string): Promise<string> {
	try {
		const data = await executeGraphQL<
			ProductListByCategoryUniqueQuery,
			ProductListByCategoryUniqueQueryVariables
		>(ProductListByCategoryUniqueDocument, {
			variables: { slug },
			revalidate: 60,
		});

		return data.category?.name || getCategoryNameFromSlug(slug);
	} catch (error) {
		console.error("Error fetching category name:", error);
		return getCategoryNameFromSlug(slug);
	}
}

// Fallback función
function getCategoryNameFromSlug(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export default async function CategoryPage({ params }: { params: { slug: string; name: string } }) {
	const { slug } = params;
	const categoryName = await getCategoryName(slug);

	return (
		<div>
			<CustomHeaderMessage categoryName={categoryName} />
			<SubCategory slug={slug} />
		</div>
	);
}

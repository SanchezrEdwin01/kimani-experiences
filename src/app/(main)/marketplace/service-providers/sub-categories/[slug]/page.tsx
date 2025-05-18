"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProductListByCategory } from "@/ui/components/nav/components/Categories/SubCategory/product/Product";
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

function getCategoryNameFromSlug(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export default function CategoryProductsPage({ params }: { params: { slug: string } }) {
	const { slug } = params;
	const router = useRouter();
	const [categoryName, setCategoryName] = React.useState<string>("");

	React.useEffect(() => {
		async function loadCategoryName() {
			const name = await getCategoryName(slug);
			setCategoryName(name);
		}
		void loadCategoryName();
	}, [slug]);

	return (
		<div className="container mx-auto py-6">
			<div className="px-6 py-2">
				<button
					onClick={() => void router.back()}
					className="mb-4 flex items-center gap-2 text-xl text-white transition hover:text-gray-300"
				>
					← Back
				</button>
			</div>
			<CustomHeaderMessage categoryName={categoryName} />
			<ProductListByCategory slug={slug} />
		</div>
	);
}

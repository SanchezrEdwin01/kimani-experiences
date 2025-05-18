import React from "react";
import { EventPlaningList } from "@/ui/components/nav/components/manageCategories/eventPlanning/eventPlanning";
import { executeGraphQL } from "@/lib/graphql";
import {
	CategorySubcategoriesDocument,
	type CategorySubcategoriesQuery,
	type CategorySubcategoriesQueryVariables,
	CategoriesDocument,
	type CategoriesQuery,
} from "@/gql/graphql";
import { ClientFloatingWrapperSub } from "@/ui/components/nav/components/manageCategories/FormSubCategory/FloatButton/FloatingWrapper";

export default async function Page({
	searchParams,
}: {
	searchParams: Record<string, string | string[] | undefined>;
}) {
	const parentRaw = searchParams.parent;
	const parent = Array.isArray(parentRaw) ? parentRaw[0] : parentRaw ?? "";

	let categories: any[] = [];

	if (parent) {
		const dataAll = await executeGraphQL<CategoriesQuery, {}>(CategoriesDocument, {});
		categories = dataAll.categories?.edges.map(({ node }) => node) ?? [];
	} else {
		const data = await executeGraphQL<CategorySubcategoriesQuery, CategorySubcategoriesQueryVariables>(
			CategorySubcategoriesDocument,
			{
				variables: { slug: "service-providers" },
				cache: "no-cache",
			},
		);

		if (!data.category?.children) {
			return (
				<p className="p-8 text-center text-red-400">
					No subcategories were found for &quot;service-providers&quot;.
				</p>
			);
		}

		categories = data.category.children.edges.map((e) => e.node);
	}

	return (
		<ClientFloatingWrapperSub parent={parent}>
			<EventPlaningList categories={categories} />
		</ClientFloatingWrapperSub>
	);
}

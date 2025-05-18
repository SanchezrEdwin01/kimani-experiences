import { ManageProvider } from "@/ui/components/nav/components/manageProvider/manageServiceProviders";
import { executeGraphQL } from "@/lib/graphql";
import {
	type CategorySubcategoriesQuery,
	type CategorySubcategoriesQueryVariables,
	CategorySubcategoriesDocument,
} from "@/gql/graphql";

export default async function Page() {
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
				No subcategories were found for &quot;{"service-providers"}&quot;.
			</p>
		);
	}

	const categories = data.category.children.edges.map((e) => e.node);
	return (
		<div>
			<ManageProvider categories={categories} />
		</div>
	);
}

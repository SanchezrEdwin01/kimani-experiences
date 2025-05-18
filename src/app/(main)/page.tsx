import {
	ProductListByCollectionDocument,
	type ProductListByCollectionQuery,
	type ProductListByCollectionQueryVariables,
	type ProductListItemFragment,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { ProductList } from "@/ui/components/nav/components/service-provider/ProductList";

export const metadata = {
	title: "ACME Storefront, powered by Saleor & Next.js",
	description:
		"Storefront Next.js Example for building performant e-commerce experiences with Saleor - the composable, headless commerce platform for global brands.",
};

export default async function Page() {
	const data = await executeGraphQL<ProductListByCollectionQuery, ProductListByCollectionQueryVariables>(
		ProductListByCollectionDocument,
		{
			variables: {
				slug: "all-services",
			},
			revalidate: 60,
		},
	);

	if (!data.collection?.products) throw Error("No products found");

	const products = data.collection.products.edges
		.map((edge) => edge?.node)
		.filter((node): node is ProductListItemFragment => node !== null);

	return (
		<div>
			<section className="mx-auto max-w-7xl p-8 pb-16">
				<ProductList products={products} />
			</section>
		</div>
	);
}

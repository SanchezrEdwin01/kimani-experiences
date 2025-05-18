import React from "react";
import { ProductList } from "./product-list/ProductList";
import { type ProductListItemFragment } from "@/gql/graphql";

interface ClickableProductListProps {
	products: readonly ProductListItemFragment[];
	categoryName: string;
}

export const ClickableProductList: React.FC<ClickableProductListProps> = ({ products }) => {
	if (!products || products.length === 0) {
		return <p className="py-8 text-center text-white">No products found.</p>;
	}

	return (
		<div className="container mx-auto py-4">
			<ProductList products={products} />
		</div>
	);
};

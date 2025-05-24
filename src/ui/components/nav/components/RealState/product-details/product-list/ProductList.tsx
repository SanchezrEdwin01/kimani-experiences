import { ProductElement } from "./product-element/ProductElement";
import { type ProductListItemNoReviewsFragment } from "@/gql/graphql";

export const ProductList = ({ products }: { products: readonly ProductListItemNoReviewsFragment[] }) => {
	return (
		<ul
			role="list"
			data-testid="ProductList"
			className="mx-4 grid grid-cols-1 gap-2 sm:mx-6 sm:grid-cols-1 md:mx-8 lg:grid-cols-3"
		>
			{products.map((product, index) => (
				<ProductElement
					key={product.id}
					product={product}
					priority={index === 0}
					loading={index < 3 ? "eager" : "lazy"}
				/>
			))}
		</ul>
	);
};

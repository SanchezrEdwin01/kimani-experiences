import Link from "next/link";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";

import type { ProductListItemFragment } from "@/gql/graphql";

export function ProductElement({
	product,
	loading,
	priority,
}: { product: ProductListItemFragment } & { loading: "eager" | "lazy"; priority?: boolean }) {
	return (
		<li data-testid="ProductElement">
			<Link href={`/marketplace/service-providers/${product.slug}`} key={product.id}>
				<div>
					{product?.thumbnail?.url && (
						<ProductImageWrapper
							loading={loading}
							src={product.thumbnail.url}
							alt={product.thumbnail.alt ?? ""}
							width={512}
							height={512}
							sizes={"512px"}
							priority={priority}
						/>
					)}
					<div className="mb-2 mt-2 flex justify-between">
						<div>
							<h3 className="mt-1 text-sm font-semibold text-white">{product.name}</h3>
						</div>
					</div>
				</div>
			</Link>
		</li>
	);
}

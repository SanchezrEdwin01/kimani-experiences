import Link from "next/link";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";

import type { ProductListItemNoReviewsFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/graphql";

export function ProductElement({
	product,
	loading,
	priority,
}: { product: ProductListItemNoReviewsFragment } & { loading: "eager" | "lazy"; priority?: boolean }) {
	let currency: string | null = null;
	if (Array.isArray(product.attributes)) {
		const currencyAttr = product.attributes.find((attr) => attr.attribute.name?.toLowerCase() === "currency");
		if (currencyAttr?.values?.length) {
			currency = currencyAttr.values[0]?.name ?? null;
		}
	}

	const startObj = product.pricing?.priceRange?.start?.gross;
	const stopObj = product.pricing?.priceRange?.stop?.gross;

	const range = {
		start: startObj
			? {
					amount: startObj.amount,
					currency: currency ?? startObj.currency,
			  }
			: null,
		stop: stopObj
			? {
					amount: stopObj.amount,
					currency: currency ?? stopObj.currency,
			  }
			: null,
	};

	const displayPrice =
		range.start && range.start.amount === 0 ? "Contact For Price" : formatMoneyRange(range);

	return (
		<li data-testid="ProductElement">
			<Link href={`/experiences/luxury-goods/${product.slug}`} key={product.id}>
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
					<div className="mt-2 flex justify-between">
						<div>
							<h3 className="mt-1 text-sm font-semibold text-white">{product.name}</h3>
							<p className="text-sm text-gray-300">{displayPrice}</p>
						</div>
					</div>
				</div>
			</Link>
		</li>
	);
}

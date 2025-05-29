import Link from "next/link";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import type { ProductListItemNoReviewsFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/graphql";

interface RichTextBlock {
	data: { text: string };
}

interface RichText {
	blocks?: RichTextBlock[];
}

export function ProductElement({
	product,
	loading,
	priority,
}: {
	product: ProductListItemNoReviewsFragment;
	loading: "eager" | "lazy";
	priority?: boolean;
}) {
	let plainDescription = "";
	const raw = product.description ?? "";
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as RichText;
			if (Array.isArray(parsed.blocks)) {
				plainDescription = parsed.blocks.map((b) => b.data.text).join(" ");
			}
		} catch {
			plainDescription = "";
		}
	}

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

	return (
		<li key={product.id} data-testid="ProductElement">
			<Link href={`/marketplace/art/${product.slug}`}>
				<div>
					{product.thumbnail?.url && (
						<div className="relative h-0 w-full overflow-hidden rounded-lg pb-[56.25%]">
							<ProductImageWrapper
								src={product.thumbnail.url}
								alt={product.thumbnail.alt ?? ""}
								fill
								className="rounded-lg object-cover"
								loading={loading}
								priority={priority}
							/>
						</div>
					)}
					<div className="mt-2 flex justify-between pb-2">
						<div>
							<h3 className="mt-1 text-sm font-semibold text-white">{product.name}</h3>
							<p className="mt-1 text-sm text-white">{formatMoneyRange(range)}</p>
							<p className="mt-1 text-xs text-gray-300">{plainDescription}</p>
						</div>
					</div>
				</div>
			</Link>
		</li>
	);
}

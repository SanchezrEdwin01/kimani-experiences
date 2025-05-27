import Link from "next/link";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import type { ProductListItemNoReviewsFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/graphql";

interface RichTextBlock {
	data: {
		text: string;
	};
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
	const descRaw = product.description ?? "";
	if (descRaw) {
		try {
			const descObj = JSON.parse(descRaw) as RichText;
			if (Array.isArray(descObj.blocks)) {
				plainDescription = descObj.blocks.map((b) => b.data.text).join(" ");
			}
		} catch {
			plainDescription = "";
		}
	}

	let cityName: string | null = null;
	if (Array.isArray(product.attributes)) {
		const cityAttr = product.attributes.find((attr) => attr.attribute.name?.toLowerCase() === "city");
		if (cityAttr?.values?.length) {
			cityName = cityAttr.values[0]?.name ?? null;
		}
	}

	return (
		<li data-testid="ProductElement">
			<Link href={`/marketplace/real-estate/${product.slug}`}>
				<div>
					{product.thumbnail?.url && (
						<div className="relative h-0 w-full overflow-hidden rounded-lg pb-[56.25%]">
							<ProductImageWrapper
								src={product.thumbnail.url}
								alt={product.thumbnail.alt ?? ""}
								fill
								className="object-cover"
								loading={loading}
								priority={priority}
							/>
						</div>
					)}
					<div className="mt-2 flex justify-between pb-2">
						<div>
							<h3 className="mt-1 text-sm font-semibold text-white">
								{product.name}
								{cityName && ` | ${cityName}`}
							</h3>
							{product.category && <p className="mt-1 text-xs text-gray-400">{product.category.name}</p>}
							<p className="mt-1 text-sm text-white">
								{formatMoneyRange({
									start: product.pricing?.priceRange?.start?.gross,
									stop: product.pricing?.priceRange?.stop?.gross,
								})}{" "}
								/{" "}
								{product.attributes &&
									product.attributes
										.filter((attr) => attr.attribute.name?.toLowerCase() === "level listing")
										.map((attr) =>
											attr.values && attr.values.length > 0
												? attr.values.map((val) => val.name).join(", ")
												: "",
										)
										.join(", ")}
							</p>
							<p className="mt-1 text-xs text-gray-300">{plainDescription}</p>
						</div>
					</div>
				</div>
			</Link>
		</li>
	);
}

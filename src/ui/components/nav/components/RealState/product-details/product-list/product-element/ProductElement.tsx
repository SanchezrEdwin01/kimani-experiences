import Link from "next/link";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import type { ProductListItemNoReviewsFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/graphql";

export function ProductElement({
	product,
	loading,
	priority,
}: {
	product: ProductListItemNoReviewsFragment;
	loading: "eager" | "lazy";
	priority?: boolean;
}) {
	let cityName: string | null = null;
	if (Array.isArray(product.attributes)) {
		const cityAttr = product.attributes.find((attr) => attr.attribute.name?.toLowerCase() === "city");
		if (cityAttr?.values?.length) {
			cityName = cityAttr.values[0]?.name ?? null;
		}
	}

	let countryName: string | null = null;
	if (Array.isArray(product.attributes)) {
		const countryAttr = product.attributes.find((attr) => attr.attribute.name?.toLowerCase() === "country");
		if (countryAttr?.values?.length) {
			countryName = countryAttr.values[0]?.name ?? null;
		}
	}

	let numbBedrooms: string | null = null;
	if (Array.isArray(product.attributes)) {
		const bedroomsAttr = product.attributes.find((attr) => attr.attribute.name?.toLowerCase() === "bedrooms");
		if (bedroomsAttr?.values?.length) {
			numbBedrooms = bedroomsAttr.values[0]?.name ?? null;
		}
	}

	let priceOptions: string | null = null;
	if (Array.isArray(product.attributes)) {
		const priceAttr = product.attributes.find(
			(attr) => attr.attribute.name?.toLowerCase() === "price options",
		);
		if (priceAttr?.values?.length) {
			priceOptions = priceAttr.values[0]?.name ?? null;
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
								{`${numbBedrooms ?? ""} bedroom ${product.category?.name} - ${countryName ?? ""} - ${
									cityName ?? ""
								}`}
							</h3>
							{product.category && <p className="mt-1 text-xs text-gray-400">{product.category.name}</p>}
							<p className="mt-1 text-sm text-white">
								{formatMoneyRange(range)}/ {priceOptions}
							</p>
							<p className="mt-1 text-sm text-gray-500">
								{`${product.category?.name} / ${
									product.attributes &&
									product.attributes
										.filter((attr) => attr.attribute.name?.toLowerCase() === "level listing")
										.map((attr) =>
											attr.values && attr.values.length > 0
												? attr.values.map((val) => val.name).join(", ")
												: "",
										)
										.join(", ")
								}`}
							</p>
						</div>
					</div>
				</div>
			</Link>
		</li>
	);
}

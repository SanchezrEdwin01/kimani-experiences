import React from "react";
import { ProductPage } from "@/ui/components/nav/components/Categories/SubCategory/product/product-details/Details";

function getCategoryNameFromSlug(slug: string): string {
	return slug
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

export default function DetailsPage({ params }: { params: { slug: string; detailsSlug: string } }) {
	const { slug, detailsSlug } = params;
	const categoryName = getCategoryNameFromSlug(slug);

	return (
		<div className="container mx-auto py-6">
			<ProductPage slug={detailsSlug} categoryName={categoryName} />
		</div>
	);
}

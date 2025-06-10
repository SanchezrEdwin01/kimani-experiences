"use client";

import { useParams } from "next/navigation";
import { ServiceForm } from "@/ui/components/nav/components/FormMarketplace";

export default function EditServiceProvider() {
	const params = useParams();
	const { slug } = params;

	const productSlug = Array.isArray(slug) ? slug[0] : slug;

	if (!productSlug) {
		return <div>Loading...</div>;
	}

	return <ServiceForm productSlug={productSlug} />;
}

// app/real-estate/edit/[slug]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { RealEstateForm } from "@/ui/components/nav/components/RealState/FormReal";

export default function EditRealEstatePage() {
	const params = useParams();
	const { slug } = params;

	const productSlug = Array.isArray(slug) ? slug[0] : slug;

	if (!productSlug) {
		return <div>Loading...</div>;
	}

	return <RealEstateForm productSlug={productSlug} />;
}

// app/real-estate/edit/[slug]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { LuxuryGoodsForm } from "@/ui/components/nav/components/luxury-goods/FormLuxury";
export default function EditLuxuryGoodPage() {
	const params = useParams();
	const { slug } = params;

	const productSlug = Array.isArray(slug) ? slug[0] : slug;

	if (!productSlug) {
		return <div>Loading...</div>;
	}

	return <LuxuryGoodsForm productSlug={productSlug} />;
}

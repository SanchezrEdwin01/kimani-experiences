"use client";

import { useParams } from "next/navigation";
import { ArtForm } from "@/ui/components/nav/components/art/FormArt";

export default function EditArt() {
	const params = useParams();
	const { slug } = params;

	const productSlug = Array.isArray(slug) ? slug[0] : slug;

	if (!productSlug) {
		return <div>Loading...</div>;
	}

	return <ArtForm productSlug={productSlug} />;
}

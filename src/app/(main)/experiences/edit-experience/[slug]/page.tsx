"use client";

import { useParams } from "next/navigation";
import { ExperienceForm } from "../../FormExperiences";
export default function EditLuxuryGoodPage() {
	const params = useParams();
	const { slug } = params;

	const productSlug = Array.isArray(slug) ? slug[0] : slug;

	if (!productSlug) {
		return <div>Loading...</div>;
	}

	return <ExperienceForm productSlug={productSlug} />;
}

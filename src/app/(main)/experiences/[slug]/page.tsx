import { type Metadata, type ResolvingMetadata } from "next";

import { ExperiencePageClient } from "./ExperiencePageClient";
import { ProductDetailsBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { extractPlainText } from "@/lib/og-helpers";

interface ExperiencePageProps {
	params: {
		slug: string;
	};
}

export async function generateMetadata(
	{ params }: ExperiencePageProps,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const { product } = await executeGraphQL(ProductDetailsBySlugDocument, {
		variables: { slug: params.slug, channel: "default-channel" },
		revalidate: 60,
	});

	if (!product) {
		return { title: "KIMANI Experiences" };
	}

	const title = product.seoTitle || product.name;
	const description = product.seoDescription || extractPlainText(product.description) || "";
	const image = product.thumbnail?.url;
	const parentTitle = (await parent).title?.absolute;

	return {
		title: `${title} | ${parentTitle ?? "KIMANI Experiences"}`,
		description,
		openGraph: {
			type: "website",
			title,
			description,
			...(image && {
				images: [{ url: image, alt: product.thumbnail?.alt ?? title }],
			}),
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			...(image && { images: [image] }),
		},
	};
}

export default function ExperiencePage({ params }: ExperiencePageProps) {
	return <ExperiencePageClient params={params} />;
}

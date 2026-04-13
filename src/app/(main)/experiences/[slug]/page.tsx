import { type Metadata, type ResolvingMetadata } from "next";

import { ExperiencePageClient } from "./ExperiencePageClient";
import { ProductDetailsBySlugDocument, type ProductDetailsBySlugQuery } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { extractPlainText } from "@/lib/og-helpers";

interface ExperiencePageProps {
	params: {
		slug: string;
	};
}

const SITE_NAME = "KIMANI Experiences";
const FALLBACK_DESCRIPTION = "Discover unique experiences curated exclusively for the KIMANI community.";

const buildFallbackMetadata = (): Metadata => ({
	title: SITE_NAME,
	description: FALLBACK_DESCRIPTION,
	openGraph: {
		type: "website",
		siteName: SITE_NAME,
		title: SITE_NAME,
		description: FALLBACK_DESCRIPTION,
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: FALLBACK_DESCRIPTION,
	},
});

export async function generateMetadata(
	{ params }: ExperiencePageProps,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	let product: ProductDetailsBySlugQuery["product"] | null = null;

	try {
		const result = await executeGraphQL(ProductDetailsBySlugDocument, {
			variables: { slug: params.slug, channel: "default-channel" },
			revalidate: 60,
		});
		product = result.product;
	} catch {
		return buildFallbackMetadata();
	}

	if (!product) {
		return buildFallbackMetadata();
	}

	const title = product.seoTitle || product.name;
	const description =
		product.seoDescription ||
		extractPlainText(product.description) ||
		`Discover ${product.name} on KIMANI Experiences.`;
	const image = product.thumbnail?.url;
	const parentTitle = (await parent).title?.absolute;
	const pageUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? ""}/experiences/${params.slug}`;

	return {
		title: `${title} | ${parentTitle ?? SITE_NAME}`,
		description,
		openGraph: {
			type: "website",
			siteName: SITE_NAME,
			url: pageUrl,
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

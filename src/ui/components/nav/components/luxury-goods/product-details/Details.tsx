"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon, ShareIcon } from "@heroicons/react/24/solid";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import { executeGraphQL } from "@/lib/graphql";
import {
	ProductDetailsBySlugDocument,
	type ProductDetailsBySlugQuery,
	type ProductDetailsBySlugQueryVariables,
} from "@/gql/graphql";

interface ProductPageProps {
	slug: string;
	categoryName: string;
}

export function ProductPage({ slug }: ProductPageProps) {
	const router = useRouter();
	const [product, setProduct] = useState<ProductDetailsBySlugQuery["product"] | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	useEffect(() => {
		if (!slug) return;
		void executeGraphQL<ProductDetailsBySlugQuery, ProductDetailsBySlugQueryVariables>(
			ProductDetailsBySlugDocument,
			{ variables: { slug, channel: "default-channel" } },
		)
			.then((data) => setProduct(data.product))
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [slug]);

	// parse description (rich text or plain text)
	const descriptionBlocks = useMemo(() => {
		if (!product?.description) return [];
		try {
			const doc = JSON.parse(product.description) as DescriptionDoc;
			return Array.isArray(doc.blocks) ? doc.blocks : [];
		} catch {
			return [{ type: "paragraph", data: { text: product.description } }];
		}
	}, [product?.description]);

	// helper for attributes
	const getAttr = (key: string): string | undefined => {
		const v = product?.attributes.find((a) => a.attribute.slug === key)?.values?.[0]?.name;
		return typeof v === "string" ? v : undefined;
	};

	// complete address
	const address = getAttr("address");
	const city = getAttr("city");

	// price
	const variant = product?.variants?.[0];
	const price = variant?.pricing?.price?.gross?.amount;
	const currency = variant?.pricing?.price?.gross?.currency;

	// date formatting
	const formatDate = (d?: string) =>
		d
			? new Date(d).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
			  })
			: "";

	// images
	const productImages = product?.media?.map((m) => m.url) || [];
	if (product?.thumbnail?.url && !productImages.includes(product.thumbnail.url)) {
		productImages.unshift(product.thumbnail.url);
	}

	if (loading) return <p className={styles.loading}>Loading…</p>;
	if (!product) return <p className={styles.error}>Product not found</p>;

	return (
		<div className={styles.container}>
			{/* Hero + overlay buttons */}
			<div className={styles.heroWrapper}>
				<Image
					src={productImages[currentImageIndex] || ""}
					alt={product.name}
					fill
					sizes="100vw"
					className={styles.hero}
				/>
				<button className={styles.backBtn} onClick={() => router.back()} aria-label="Back">
					<ArrowLeftIcon />
				</button>
				<div className={styles.actionGroup}>
					<button aria-label="Save">
						<BookmarkIcon />
					</button>
					<button aria-label="Share">
						<ShareIcon />
					</button>
				</div>
				{productImages.length > 1 && (
					<div className={styles.galleryControls}>
						{productImages.map((_, idx) => (
							<button
								key={idx}
								className={`${styles.galleryDot} ${idx === currentImageIndex ? styles.active : ""}`}
								onClick={() => setCurrentImageIndex(idx)}
								aria-label={`View image ${idx + 1}`}
							/>
						))}
					</div>
				)}
			</div>

			{/* Category */}
			<div className={styles.metaInfo}>
				<p className={styles.category}>{product.category?.name || ""}</p>
			</div>

			{/* Title and subtitle */}
			<h1 className={styles.title}>{product.name}</h1>
			<p className={styles.subtype}>{product.productType.name}</p>

			{/* Price and discount */}
			<div className={styles.priceSection}>
				{price !== undefined && currency && (
					<p className={styles.price}>
						{new Intl.NumberFormat("en-US", {
							style: "currency",
							currency,
						}).format(price)}
					</p>
				)}
				{city && <p className={styles.cityDisplay}>{city}</p>}
			</div>

			<hr className={styles.divider} />

			{/* Description */}
			<section className={styles.descriptionSection}>
				<h2 className={styles.sectionTitle}>Description</h2>
				{descriptionBlocks.length > 0 ? (
					descriptionBlocks.map(
						(b, i) =>
							b.type === "paragraph" && (
								<p key={i} className={styles.text}>
									{b.data.text}
								</p>
							),
					)
				) : (
					<p className={styles.text}>{product.description}</p>
				)}
				<hr className={styles.divider} />
			</section>

			{/* Product Details */}
			<section>
				<h2 className={styles.sectionTitle}>Product details</h2>
				<div className={styles.detailsList}>
					{product.category && (
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Category</span>
							<span className={styles.detailValue}>{product.category.name}</span>
						</div>
					)}
					{address && (
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Location</span>
							<span className={styles.detailValue}>{address}</span>
						</div>
					)}
					{!address && city && (
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Location</span>
							<span className={styles.detailValue}>{city}</span>
						</div>
					)}
					<div className={styles.detailItem}>
						<span className={styles.detailLabel}>Condition</span>
						<span className={styles.detailValue}>{getAttr("condition") || "No condition"}</span>
					</div>
					{product.created && (
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Posted on</span>
							<span className={styles.detailValue}>{formatDate(product.created)}</span>
						</div>
					)}
				</div>
				<hr className={styles.divider} />
			</section>

			{/* External Links Section */}
			{getAttr("external-link") && (
				<>
					<section className={styles.externalLinksSection}>
						<h2 className={styles.sectionTitle}>External links</h2>
						<div className={styles.externalLinkField}>
							<a href={getAttr("external-link")} target="_blank" rel="noreferrer">
								{getAttr("external-link")}
							</a>
						</div>
						<div className={styles.buttonGroup}>
							<button className={styles.deleteButton}>Delete</button>
							<button className={styles.editButton}>Edit</button>
						</div>
					</section>
					<hr className={styles.divider} />
				</>
			)}
		</div>
	);
}

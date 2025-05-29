"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon, ShareIcon } from "@heroicons/react/24/solid";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import { executeGraphQL , formatMoneyRange } from "@/lib/graphql";
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
	const pathname = usePathname();
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

	const descriptionBlocks = useMemo(() => {
		if (!product?.description) return [];
		try {
			const doc = JSON.parse(product.description) as DescriptionDoc;
			return Array.isArray(doc.blocks) ? doc.blocks : [];
		} catch {
			return [{ type: "paragraph", data: { text: product.description } }];
		}
	}, [product?.description]);

	const getAttr = (key: string): string | undefined => {
		const v = product?.attributes.find((a) => a.attribute.slug === key)?.values?.[0]?.name;
		return typeof v === "string" ? v : undefined;
	};

	const address = getAttr("address");
	const city = getAttr("city");

	const startObj = product?.pricing?.priceRange?.start?.gross;
	const stopObj = product?.pricing?.priceRange?.stop?.gross;

	let currency: string | null = null;
	if (Array.isArray(product?.attributes)) {
		const currencyAttr = product?.attributes.find(
			(attr) => attr.attribute.name?.toLowerCase() === "currency",
		);
		if (currencyAttr?.values?.length) {
			currency = currencyAttr.values[0]?.name ?? null;
		}
	}

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

	const formatDate = (d?: string) =>
		d
			? new Date(d).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
			  })
			: "";

	const productImages = product?.media?.map((m) => m.url) || [];
	if (product?.thumbnail?.url && !productImages.includes(product.thumbnail.url)) {
		productImages.unshift(product.thumbnail.url);
	}

	const goUpOneLevel = () => {
		const parts = pathname.split("/");
		const parent = parts.slice(0, -1).join("/") || "/";
		router.push(parent);
	};

	useEffect(() => {
		if (product) {
			console.log("Product media:", product.media);
			console.log("Product thumbnail:", product.thumbnail);
			console.log("Final productImages array:", productImages);
		}
	}, [product, productImages]);

	if (loading) return <p className={styles.loading}>Loading…</p>;
	if (!product) return <p className={styles.error}>Product not found</p>;

	return (
		<div className={styles.container}>
			<div className={styles.heroWrapper}>
				<Image
					src={productImages[currentImageIndex] || ""}
					alt={product.name}
					fill
					sizes="100vw"
					className={styles.hero}
					style={{ objectFit: "cover" }}
				/>
				<button className={styles.backBtn} onClick={goUpOneLevel} aria-label="Back">
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
					<div className={styles.galleryNavigation}>
						<button
							className={styles.prevBtn}
							onClick={() =>
								setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))
							}
							aria-label="Previous image"
						>
							<ArrowLeftIcon />
						</button>

						<div className={styles.imageCounter}>
							{currentImageIndex + 1} / {productImages.length}
						</div>

						<button
							className={styles.nextBtn}
							onClick={() =>
								setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))
							}
							aria-label="Next image"
						>
							<ArrowLeftIcon style={{ transform: "rotate(180deg)" }} />
						</button>
					</div>
				)}
			</div>

			<div className={styles.metaInfo}>
				<p className={styles.category}>{product.category?.name || ""}</p>
			</div>

			<h1 className={styles.title}>{product.name}</h1>
			<p className={styles.subtype}>{product.productType.name}</p>

			<div className={styles.priceSection}>
				<div className={styles.priceSection}>{formatMoneyRange(range)}</div>
				{city && <p className={styles.cityDisplay}>{city}</p>}
			</div>

			<section>
				<div className={styles.ambassadorInfo}>
					<div className={styles.ambassadorIcon}>
						<Image src="/luxury-profile.jpg" alt="Listing Agent" width={48} height={48} />
					</div>
					<div className={styles.ambassadorDetails}>
						<p>User of listing agent</p>
						<p className={styles.ambassadorName}>Type of member</p>
					</div>
				</div>
			</section>
			<hr className={styles.divider} />

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

			{getAttr("external-link") && (
				<>
					<section className={styles.externalLinksSection}>
						<h2 className={styles.sectionTitle}>External links</h2>
						<div className={styles.externalLinkField}>
							<a href={getAttr("external-link")} target="_blank" rel="noreferrer">
								{getAttr("external-link")}
							</a>
						</div>
					</section>
					<hr className={styles.divider} />
				</>
			)}
			<button className={styles.messageButton}>Message listing member</button>
		</div>
	);
}

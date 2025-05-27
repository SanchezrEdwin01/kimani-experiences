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

	// parse description (rich text o texto plano)
	const descriptionBlocks = useMemo(() => {
		if (!product?.description) return [];
		try {
			const doc = JSON.parse(product.description) as DescriptionDoc;
			return Array.isArray(doc.blocks) ? doc.blocks : [];
		} catch {
			return [{ type: "paragraph", data: { text: product.description } }];
		}
	}, [product?.description]);

	// helper para atributos
	const getAttr = (key: string): string | undefined => {
		const v = product?.attributes.find((a) => a.attribute.slug === key)?.values?.[0]?.name;
		return typeof v === "string" ? v : undefined;
	};

	// price
	const variant = product?.variants?.[0];
	const price = variant?.pricing?.price?.gross?.amount;
	const currency = variant?.pricing?.price?.gross?.currency || "USD";

	// images
	const productImages = product?.media?.map((m) => m.url) || [];
	if (product?.thumbnail?.url && !productImages.includes(product.thumbnail.url)) {
		productImages.unshift(product.thumbnail.url);
	}

	// Enlaces externos
	const externalLink = getAttr("external-link");
	const certificateUrl = getAttr("certificate-of-authenticity");

	// Datos del producto
	const productName = product?.name || "No name";
	const productDescription = product?.description || "No description available";

	// atributos de arte
	const dimensions = getAttr("dimensions");
	const datePainted = getAttr("date-painted");
	const signature = getAttr("signature");
	const artType = getAttr("art-type");
	const printType = getAttr("name");
	const frame = getAttr("frame");

	if (loading) return <p className={styles.loading}>Loading…</p>;
	if (!product) return <p className={styles.error}>Product not found</p>;

	return (
		<div className={styles.container}>
			{/* Hero + overlay buttons */}
			<div className={styles.heroWrapper}>
				{productImages.length > 0 ? (
					<Image
						src={productImages[currentImageIndex]}
						alt={productName}
						fill
						sizes="100vw"
						className={styles.hero}
						style={{ objectFit: "cover" }}
					/>
				) : (
					<div className={styles.placeholderImage} />
				)}
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

						{/* Agregar contador de imágenes */}
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

			{/* Brand/Title */}
			<h1 className={styles.title}>{productName}</h1>

			{/* Price & Location */}
			<div className={styles.priceAndLocation}>
				<p className={styles.price}>
					{price !== undefined
						? new Intl.NumberFormat("en-US", {
								style: "currency",
								currency,
						  }).format(price)
						: "Price not available"}
				</p>
			</div>

			{/* Review Section - User of listing agent */}
			<section>
				<div className={styles.ambassadorInfo}>
					<div className={styles.ambassadorIcon}>
						<Image src="/art-profile.jpg" alt="Listing Agent" width={48} height={48} />
					</div>
					<div className={styles.ambassadorDetails}>
						<p>User of listing agent</p>
						<p className={styles.ambassadorName}>Type of member</p>
					</div>
				</div>
			</section>
			<hr className={styles.divider} />

			{/* Description */}
			<section className={styles.descriptionSection}>
				<h2 className={styles.sectionHeader}>Description</h2>
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
					<p className={styles.text}>{productDescription}</p>
				)}
			</section>

			<hr className={styles.divider} />

			{/* Artwork details */}
			<section className={styles.artworkDetails}>
				<h2 className={styles.sectionHeader}>Artwork details</h2>
				<div className={styles.artworkDetailsList}>
					<div className={styles.artworkDetailItem}>
						<div className={styles.artworkDetailLabel}>Art type</div>
						<div className={styles.artworkDetailValue}>{artType || "Unknown"}</div>
					</div>
					<div className={styles.artworkDetailItem}>
						<div className={styles.artworkDetailLabel}>Dimensions</div>
						<div className={styles.artworkDetailValue}>{dimensions || "Unknown"}</div>
					</div>
					<div className={styles.artworkDetailItem}>
						<div className={styles.artworkDetailLabel}>Print type</div>
						<div className={styles.artworkDetailValue}>{printType || "Unknown"}</div>
					</div>
					<div className={styles.artworkDetailItem}>
						<div className={styles.artworkDetailLabel}>Date painted</div>
						<div className={styles.artworkDetailValue}>{datePainted || "Unknown"}</div>
					</div>
					<div className={styles.artworkDetailItem}>
						<div className={styles.artworkDetailLabel}>Frame</div>
						<div className={styles.artworkDetailValue}>{frame || "No frame"}</div>
					</div>
					<div className={styles.artworkDetailItem}>
						<div className={styles.artworkDetailLabel}>Signature</div>
						<div className={styles.artworkDetailValue}>
							{signature ? `Signature of ${signature}` : "No signature"}
						</div>
					</div>
				</div>
			</section>

			<hr className={styles.divider} />

			{/* External links */}
			<section className={styles.externalLinksSection}>
				<h2 className={styles.sectionHeader}>External links</h2>
				<div className={styles.externalLinkWrapper}>
					{externalLink ? (
						<input
							type="text"
							readOnly
							value={`Https://${externalLink.replace(/^https?:\/\//, "")}`}
							className={styles.externalLinkInput}
							aria-label="External link"
						/>
					) : (
						<input
							type="text"
							readOnly
							value=""
							placeholder="No external link available"
							className={styles.externalLinkInput}
							aria-label="External link"
						/>
					)}
				</div>
			</section>

			{/* Certificate of authenticity */}
			<section className={styles.certificateSection}>
				<h2 className={styles.sectionHeader}>Certificate of authenticity</h2>
				{certificateUrl ? (
					<div className={styles.fileField}>
						<div className={styles.thumbnailWrapper}>
							<Image
								src={certificateUrl}
								alt="Certificate thumbnail"
								className={styles.fileThumbnail}
								width={32}
								height={32}
							/>
						</div>
						<span className={styles.fileName}>{certificateUrl.split("/").pop()}</span>
						<a
							href={certificateUrl}
							target="_blank"
							rel="noreferrer"
							className={styles.downloadBtn}
							aria-label="Download certificate"
						>
							⬇️
						</a>
					</div>
				) : (
					<div className={styles.emptyCertificate}>No certificate available</div>
				)}
			</section>

			<button className={styles.messageButton}>Message listing member</button>
		</div>
	);
}

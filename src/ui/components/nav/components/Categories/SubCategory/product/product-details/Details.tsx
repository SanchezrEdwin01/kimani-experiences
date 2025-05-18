"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon, ShareIcon, StarIcon } from "@heroicons/react/24/solid";
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
			.catch((err) => {
				console.error(err);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [slug]);

	// 1) parse description
	const descriptionBlocks = useMemo(() => {
		let doc = {} as DescriptionDoc;
		try {
			doc = JSON.parse(product?.description ?? "") as DescriptionDoc;
		} catch {}
		return Array.isArray(doc.blocks) ? doc.blocks : [];
	}, [product?.description]);

	// 2) helper for simple attributes
	const getAttr = (key: string): string | undefined => {
		const v = product?.attributes.find((a) => a.attribute.slug === key)?.values?.[0]?.name;
		return typeof v === "string" ? v : undefined;
	};

	// 3) parse reviews (metadata.reviews as JSON-stringified array)
	const reviewsRaw = getAttr("reviews");
	const reviews: { user: string; date: string; rating: number; comment?: string }[] = [];
	if (reviewsRaw) {
		try {
			const parsed = JSON.parse(reviewsRaw);
			if (Array.isArray(parsed)) {
				parsed.forEach((item) => {
					const r = item as { user: unknown; date: unknown; rating: unknown; comment?: unknown };
					if (typeof r.user === "string" && typeof r.date === "string" && typeof r.rating === "number") {
						reviews.push({
							user: r.user,
							date: r.date,
							rating: r.rating,
							comment: typeof r.comment === "string" ? r.comment : undefined,
						});
					}
				});
			}
		} catch {
			// silent
		}
	}
	const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

	// 4) other attributes
	const scheduleText = getAttr("availability-schedule");
	const location = getAttr("location");

	// Full address parts
	const address = getAttr("address");
	const city = getAttr("city");
	const state = getAttr("state");
	const country = getAttr("country");
	const zipCode = getAttr("zip-code");
	const fullAddress = [address, city, state, zipCode, country].filter(Boolean).join(", ");

	// Date formatter
	const formatDate = (dateString?: string) => {
		if (!dateString) return "";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Product images
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
					src={productImages.length > 0 ? productImages[currentImageIndex] : ""}
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
						{productImages.map((_, index) => (
							<button
								key={index}
								className={`${styles.galleryDot} ${index === currentImageIndex ? styles.active : ""}`}
								onClick={() => setCurrentImageIndex(index)}
								aria-label={`View image ${index + 1}`}
							/>
						))}
					</div>
				)}
			</div>

			{/* Category */}
			<div className={styles.metaInfo}>
				<p className={styles.category}>{product.category?.name || ""}</p>
			</div>

			{/* Title, subtitle */}
			<h1 className={styles.title}>{product.name}</h1>
			<p className={styles.subtype}>{product.productType.name}</p>

			{/* Price and discount */}
			<div className={styles.priceSection}>
				{getAttr("discount") && (
					<p className={styles.discount}>{getAttr("discount")}% discount for Kimani members</p>
				)}
			</div>

			<hr className={styles.divider} />

			{/* Description */}
			<section className={styles.descriptionSection}>
				<h2 className={styles.sectionTitle}>Description</h2>
				{descriptionBlocks.map(
					(b, i) =>
						b.type === "paragraph" && (
							<p key={i} className={styles.text}>
								{b.data.text}
							</p>
						),
				)}
				<hr className={styles.divider} />
			</section>

			{/* Opening Hours */}
			{scheduleText && (
				<>
					<section>
						<h2 className={styles.sectionTitle}>Opening Hours</h2>
						<p className={styles.text}>{scheduleText}</p>
					</section>
					<hr className={styles.divider} />
				</>
			)}

			{/* Address + map */}
			{(address || city || state || country || zipCode || location) && (
				<>
					<section>
						<h2 className={styles.sectionTitle}>Address</h2>
						{location && <p className={styles.text}>{location}</p>}
						{address && <p className={styles.text}>Address: {address}</p>}
						{city && <p className={styles.text}>City: {city}</p>}
						{state && <p className={styles.text}>State/Province: {state}</p>}
						{country && <p className={styles.text}>Country: {country}</p>}
						{zipCode && <p className={styles.text}>Postal code: {zipCode}</p>}
						<div className={styles.mapContainer}>
							<iframe
								src={`https://www.google.com/maps?q=${encodeURIComponent(
									fullAddress || location || "",
								)}&output=embed`}
								allowFullScreen
								loading="lazy"
							/>
						</div>
					</section>
					<hr className={styles.divider} />
				</>
			)}

			{/* Additional Information */}
			<section>
				<h2 className={styles.sectionTitle}>Information</h2>
				<ul className={styles.infoList}>
					{getAttr("link") && (
						<li>
							<span>Website</span>
							<a href={getAttr("link")} target="_blank" rel="noreferrer">
								{getAttr("link")}
							</a>
						</li>
					)}
					{getAttr("phone-number") && (
						<li>
							<span>Phone number</span>
							<span>{getAttr("phone-number")}</span>
						</li>
					)}
					{getAttr("email") && (
						<li>
							<span>Email</span>
							<span>{getAttr("email")}</span>
						</li>
					)}
					{getAttr("years-in-business") && (
						<li>
							<span>Years in business</span>
							<span>{getAttr("years-in-business")}</span>
						</li>
					)}
					{getAttr("best-contact-method") && (
						<li>
							<span>Best contact method</span>
							<span>{getAttr("best-contact-method")}</span>
						</li>
					)}
					{product.created && (
						<li>
							<span>Created</span>
							<span>{formatDate(product.created)}</span>
						</li>
					)}
				</ul>
			</section>
			<hr className={styles.divider} />

			{/* Reviews */}
			{reviews.length > 0 && (
				<>
					<div className={styles.reviewsSummary}>
						{Array.from({ length: 5 }, (_, i) => (
							<StarIcon
								key={i}
								className={i < Math.round(avgRating) ? styles.starFilled : styles.starEmpty}
							/>
						))}
						<span className={styles.avgRating}>{avgRating.toFixed(1)}</span>
						<span className={styles.dot}>•</span>
						<span className={styles.reviewCount}>{reviews.length} reviews</span>
						<button className={styles.leaveReview}>Leave a review</button>
					</div>

					<ul className={styles.reviewsList}>
						{reviews.map((r, i) => (
							<li key={i} className={styles.reviewCard}>
								<div className={styles.reviewAvatar}>{r.user.charAt(0)}</div>
								<div className={styles.reviewContent}>
									<div className={styles.reviewHeader}>
										<p className={styles.reviewUser}>{r.user}</p>
										<p className={styles.reviewDate}>{r.date}</p>
									</div>
									<div className={styles.stars}>
										{Array.from({ length: 5 }, (_, j) => (
											<StarIcon key={j} className={j < r.rating ? styles.starFilled : styles.starEmpty} />
										))}
									</div>
									{r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
								</div>
							</li>
						))}
					</ul>
				</>
			)}

			{/* Call to Action */}
			{getAttr("allow-direct-messaging") === "Allow Direct Messaging: Yes" && (
				<button className={styles.cta}>Contact Provider</button>
			)}
		</div>
	);
}

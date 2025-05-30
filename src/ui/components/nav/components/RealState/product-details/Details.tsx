"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon, ShareIcon } from "@heroicons/react/24/solid";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import { formatMoneyRange, executeGraphQL } from "@/lib/graphql";
import { useUser } from "@/UserKimani/context/UserContext";
import { API_URL } from "@/UserKimani/utils/constants";
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
	const { user, isLoading } = useUser();
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
	const state = getAttr("state");
	const country = getAttr("country");
	const zipCode = getAttr("zip-code");
	const fullAddress = [address, city, state, zipCode, country].filter(Boolean).join(", ");

	const furnishing = getAttr("furnishing-options");
	const hoa = getAttr("hoa");
	const builtIn = getAttr("built-in");

	const parking = getAttr("parking-number") || "—";
	const sizeUnit = getAttr("size-unit") || "—";
	const sqft = getAttr("property-size") || "—";
	const baths = getAttr("bathrooms") || "—";
	const beds = getAttr("bedrooms") || "—";

	const goUpOneLevel = () => {
		const parts = pathname.split("/");
		const parent = parts.slice(0, -1).join("/") || "/";
		router.push(parent);
	};

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

			{/* Category */}
			<div className={styles.metaInfo}>
				<p className={styles.category}>{product.category?.name}</p>
			</div>

			<h1 className={styles.title}>{product.name}</h1>
			<p className={styles.subtype}>{product.productType.name}</p>

			{/* Price */}
			<div className={styles.priceSection}>{formatMoneyRange(range)}</div>

			<section>
				{isLoading ? (
					<p>Cargando agente…</p>
				) : user ? (
					<div className={styles.ambassadorInfo}>
						<div className={styles.ambassadorIcon}>
							<Image
								src={`${API_URL}/avatars/${user.avatar._id}`}
								alt={user.username}
								width={48}
								height={48}
							/>
						</div>
						<div className={styles.ambassadorDetails}>
							<p>
								{user.username}#{user.discriminator}
							</p>
							<p className={styles.ambassadorName}>{user.status.presence}</p>
						</div>
					</div>
				) : (
					<p>Agente no disponible</p>
				)}
			</section>
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

			{/* Address + Map */}
			{(address || city || state || country || zipCode) && (
				<>
					<section>
						<h2 className={styles.sectionTitle}>Address</h2>
						{address && <p className={styles.text}>Address: {address}</p>}
						{city && <p className={styles.text}>City: {city}</p>}
						{state && <p className={styles.text}>State/Province: {state}</p>}
						{country && <p className={styles.text}>Country: {country}</p>}
						{zipCode && <p className={styles.text}>Postal code: {zipCode}</p>}
						<div className={styles.mapContainer}>
							<iframe
								src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`}
								allowFullScreen
								loading="lazy"
							/>
						</div>
					</section>
					<hr className={styles.divider} />
				</>
			)}

			{/* Information */}
			<section>
				<h2 className={styles.sectionTitle}>Information</h2>
				<ul className={styles.infoList}>
					{furnishing && (
						<li>
							<span>Furnishing options</span>
							<span>{furnishing}</span>
						</li>
					)}
					{hoa && (
						<li>
							<span>HOA</span>
							<span>{hoa}</span>
						</li>
					)}
					{builtIn && (
						<li>
							<span>Built in</span>
							<span>{builtIn}</span>
						</li>
					)}
				</ul>
			</section>
			<hr className={styles.divider} />

			{/* Stats Grid */}
			<div className={styles.statsGrid}>
				<div className={styles.statCard}>
					<span className={styles.statValue}>{parking}</span>
					<span className={styles.statLabel}>Parking</span>
				</div>
				<div className={styles.statCard}>
					<span className={styles.statValue}>{sqft}</span>
					<span className={styles.statLabel}>{sizeUnit}</span>
				</div>
				<div className={styles.statCard}>
					<span className={styles.statValue}>{baths}</span>
					<span className={styles.statLabel}>Bathroom</span>
				</div>
				<div className={styles.statCard}>
					<span className={styles.statValue}>{beds}</span>
					<span className={styles.statLabel}>Bedroom</span>
				</div>
			</div>
			<hr className={styles.divider} />

			{/* External links */}
			{getAttr("external-link") && (
				<section className={styles.externalLinksSection}>
					<h2 className={styles.sectionTitle}>External links</h2>
					<div className={styles.externalLinkField}>
						<a href={getAttr("external-link")} target="_blank" rel="noreferrer">
							{getAttr("external-link")}
						</a>
					</div>
					<button className={styles.messageButton}>Message listing member</button>
				</section>
			)}
			<button className={styles.messageButton}>Message listing member</button>
		</div>
	);
}

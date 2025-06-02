"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon, ShareIcon } from "@heroicons/react/24/solid";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import { useUser } from "@/UserKimani/context/UserContext";
import { API_URL } from "@/UserKimani/utils/constants";
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

export function ProductPageServiceProviders({ slug }: ProductPageProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, isLoading } = useUser();
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

	const website = getAttr("link");
	const phoneNumber = getAttr("phone-number");
	const email = getAttr("email");
	const yearsInBusiness = getAttr("years-in-business");
	const bestContactMethod = getAttr("best-contact-method");
	const discount = getAttr("discount");
	const address = getAttr("address");
	const city = getAttr("city");
	const state = getAttr("state");
	const zipCode = getAttr("zip-code");

	const services = getAttr("services");
	const serviceType = getAttr("service-type");
	const offerings = getAttr("offerings");

	const primaryService = services || serviceType || product?.category?.name || "Service";

	const hasValidAddressData = address && city;

	const fullAddress = hasValidAddressData
		? `${address}, ${city}${state ? `, ${state}` : ""}${zipCode ? ` ${zipCode}` : ""}`
		: "";

	const mapQuery = hasValidAddressData ? `${address}, ${city}, ${state || ""} ${zipCode || ""}` : "";

	const productImages = product?.media?.map((m) => m.url) || [];
	if (product?.thumbnail?.url && !productImages.includes(product.thumbnail.url)) {
		productImages.unshift(product.thumbnail.url);
	}

	const goUpOneLevel = () => {
		const parts = pathname.split("/");
		const parent = parts.slice(0, -1).join("/") || "/";
		router.push(parent);
	};

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

			<section>
				<h2 className={styles.sectionTitle}>{product.name}</h2>
				<p>{primaryService}</p>
				{offerings && <p>{offerings}</p>}
				{discount && <p className={styles.discount}>{discount}% discount for Kimani members</p>}
			</section>

			{/* Review Section */}
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
					<p>Agent not available</p>
				)}
			</section>
			<hr className={styles.divider} />

			<section>
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
			</section>
			<hr className={styles.divider} />

			<section>
				<h2 className={styles.sectionTitle}>Working hours</h2>
				<div className={styles.workingHours}>
					<div className={styles.workDay}>
						<span>Mon-Fri</span>
						<span>08:00 - 18:00</span>
					</div>
					<div className={styles.workDay}>
						<span>Sat-Sun</span>
						<span>Closed</span>
					</div>
				</div>
			</section>
			<hr className={styles.divider} />

			{hasValidAddressData && (
				<>
					<section>
						<h2 className={styles.sectionTitle}>Address</h2>
						<p className={styles.fullAddress}>{fullAddress}</p>
						<div className={styles.mapContainer}>
							<iframe
								src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
									mapQuery,
								)}`}
								width="100%"
								height="100%"
								style={{ border: 0 }}
								allowFullScreen
								loading="lazy"
								referrerPolicy="no-referrer-when-downgrade"
							></iframe>
						</div>
					</section>
					<hr className={styles.divider} />
				</>
			)}

			<section>
				<h2 className={styles.sectionTitle}>Information</h2>
				<div className={styles.infoBlock}>
					{website && (
						<div className={styles.infoItem}>
							<h3 className={styles.infoLabel}>Website</h3>
							<p className={styles.infoValue}>{website.replace(/^https?:\/\//, "")}</p>
						</div>
					)}
					{phoneNumber && (
						<div className={styles.infoItem}>
							<h3 className={styles.infoLabel}>Phone number</h3>
							<p className={styles.infoValue}>{phoneNumber}</p>
						</div>
					)}
					{email && (
						<div className={styles.infoItem}>
							<h3 className={styles.infoLabel}>Email</h3>
							<p className={styles.infoValue}>{email}</p>
						</div>
					)}
					{yearsInBusiness && (
						<div className={styles.infoItem}>
							<h3 className={styles.infoLabel}>Years in business</h3>
							<p className={styles.infoValue}>{yearsInBusiness}</p>
						</div>
					)}
					{bestContactMethod && (
						<div className={styles.infoItem}>
							<h3 className={styles.infoLabel}>Best way to contact</h3>
							<p className={styles.infoValue}>Via {bestContactMethod}</p>
						</div>
					)}
				</div>
			</section>
			<hr className={styles.divider} />

			<button className={styles.messageButton}>Message service provider</button>
		</div>
	);
}

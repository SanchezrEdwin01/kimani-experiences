"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { ShareButtonWithModal } from "../../ShareButtonWithModal";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import type { User } from "@/UserKimani/types";
import { useUser } from "@/UserKimani/context/UserContext";
import { API_URL } from "@/UserKimani/utils/constants";
import { executeGraphQL } from "@/lib/graphql";
import {
	ProductDetailsBySlugDocument,
	UpdateFavoritesDocument,
	ProductDeleteDocument,
	type ProductDetailsBySlugQuery,
	type ProductDetailsBySlugQueryVariables,
	type ProductDeleteMutation,
	type ProductDeleteMutationVariables,
	type UpdateFavoritesMutation,
	type UpdateFavoritesMutationVariables,
} from "@/gql/graphql";

interface AvailabilityData {
	day: string;
	from: string;
	to: string;
	tz: string;
}

interface ProductPageProps {
	slug: string;
	categoryName: string;
}

export function ProductPageServiceProviders({ slug }: ProductPageProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { user } = useUser();
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

	const createdByUserId: string | null = useMemo(() => {
		if (!product?.metadata) return null;
		const entry = product.metadata.find((m) => m.key === "createdBy");
		return entry ? entry.value : null;
	}, [product?.metadata]);

	const creatorUser: User | null = useMemo(() => {
		if (!product?.metadata) return null;
		const entry = product.metadata.find((m) => m.key === "userData");
		if (!entry) return null;
		try {
			return JSON.parse(entry.value) as User;
		} catch {
			console.error("Error parseando product.metadata.userData:", entry.value);
			return null;
		}
	}, [product?.metadata]);

	const favoritesList: User[] = useMemo(() => {
		if (!product?.metadata) return [];
		const entry = product.metadata.find((m) => m.key === "favorites");
		if (!entry) return [];
		try {
			return JSON.parse(entry.value) as User[];
		} catch {
			console.error("Error parseando product.metadata.favorites:", entry.value);
			return [];
		}
	}, [product?.metadata]);

	const isFavorite = useMemo(() => {
		if (!user) return false;
		return favoritesList.some((u) => u._id === user._id);
	}, [favoritesList, user]);

	async function handleDeleteProduct() {
		if (!product || !createdByUserId) return;
		if (createdByUserId !== user?._id) return;

		const ok = window.confirm("¿Seguro que quieres eliminar este producto?");
		if (!ok) return;

		try {
			await executeGraphQL<ProductDeleteMutation, ProductDeleteMutationVariables>(ProductDeleteDocument, {
				variables: { id: product.id },
			});

			const parent = pathname.split("/").slice(0, -1).join("/") || "/";
			router.push(parent);
		} catch (err) {
			console.error("Error borrando producto:", err);
			alert("No se pudo eliminar.");
		}
	}

	async function toggleFavorite() {
		if (!product || !user) return;

		const entry = product.metadata.find((m) => m.key === "favorites");
		let actuales: User[] = [];
		if (entry) {
			try {
				actuales = JSON.parse(entry.value) as User[];
			} catch {
				actuales = [];
			}
		}

		const yaFavorito = actuales.some((u) => u._id === user._id);

		let nuevaLista: User[];
		if (yaFavorito) {
			nuevaLista = actuales.filter((u) => u._id !== user._id);
		} else {
			nuevaLista = [...actuales, user];
		}

		try {
			const variables: UpdateFavoritesMutationVariables = {
				id: product.id,
				favoritesJson: JSON.stringify(nuevaLista),
			};

			const res = await executeGraphQL<UpdateFavoritesMutation, UpdateFavoritesMutationVariables>(
				UpdateFavoritesDocument,
				{ variables },
			);
			const errors = res.productUpdate?.errors;
			if (errors?.length) {
				console.error("Errores actualizando favoritos:", errors);
				alert("No fue posible actualizar la lista de favoritos.");
				return;
			}

			setProduct((prev) => {
				if (!prev) return prev;
				const otras = prev.metadata?.filter((m) => m.key !== "favorites") || [];
				return {
					...prev,
					metadata: [...otras, { key: "favorites", value: JSON.stringify(nuevaLista) }],
				};
			});
		} catch (err) {
			console.error("Error en toggleFavorite:", err);
			alert("Error inesperado al modificar favoritos.");
		}
	}

	const goUpOneLevel = () => {
		const parts = pathname.split("/");
		const parent = parts.slice(0, -1).join("/") || "/";
		router.push(parent);
	};

	function handleEditProduct() {
		router.push("/marketplace/service-providers/edit-service-provider/" + product?.slug);
	}

	const currentUrl = typeof window !== "undefined" ? window.location.href : "";

	const availabilityData = useMemo(() => {
		if (!product?.metadata) return [];
		const entry = product.metadata.find((m) => m.key === "availability");
		if (!entry) return [];
		try {
			return JSON.parse(entry.value) as AvailabilityData[];
		} catch {
			console.error("Error parseando availability data:", entry.value);
			return [];
		}
	}, [product?.metadata]);

	const workingHours = useMemo(() => {
		if (availabilityData.length === 0) return {};

		const grouped: Record<string, { from: string; to: string; tz: string }> = {};
		availabilityData.forEach((item) => {
			grouped[item.day] = {
				from: item.from,
				to: item.to,
				tz: item.tz,
			};
		});

		return grouped;
	}, [availabilityData]);

	const formatTime = (timeString: string) => {
		const [hour, minute] = timeString.split(":");
		const hourNum = parseInt(hour);
		const ampm = hourNum >= 12 ? "PM" : "AM";
		const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
		return `${displayHour}:${minute} ${ampm}`;
	};

	const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
					<button
						aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
						onClick={toggleFavorite}
						className={styles.favoriteButton}
					>
						{isFavorite ? (
							<BookmarkIcon style={{ fill: "#e53e3e" }} className="h-6 w-6" />
						) : (
							<BookmarkOutlineIcon style={{ stroke: "gray" }} className="h-6 w-6" />
						)}
					</button>

					<ShareButtonWithModal
						title="Check this out!"
						text="Have a look at this listing:"
						url={currentUrl}
					/>
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

			<section>
				{creatorUser ? (
					<div className={styles.ambassadorInfo}>
						<div
							className={styles.ambassadorIcon}
							style={{
								width: 48,
								height: 48,
								borderRadius: "50%",
								overflow: "hidden",
								position: "relative",
							}}
						>
							<Image
								src={`${API_URL.replace("/api", "/autumn")}/avatars/${creatorUser.avatar._id}?max_side=256`}
								alt={creatorUser.username}
								width={48}
								height={48}
								objectFit="cover"
							/>
						</div>
						<div className={styles.ambassadorDetails}>
							<p>
								{creatorUser.username}#{creatorUser.discriminator}
							</p>
							<p className={styles.ambassadorName}>{creatorUser.status.presence}</p>
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
					{daysOfWeek.map((day) => {
						const dayData = workingHours[day];
						return (
							<div key={day} className={styles.workDay}>
								<span>{day}</span>
								{dayData ? (
									<span>
										{formatTime(dayData.from)} - {formatTime(dayData.to)}
									</span>
								) : (
									<span>Closed</span>
								)}
							</div>
						);
					})}
					{availabilityData.length === 0 && (
						<div className={styles.workDay}>
							<span>Hours not available</span>
							<span>Contact for availability</span>
						</div>
					)}
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
			{email && (
				<div className={styles.infoItem}>
					<button
						className={styles.messageButton}
						onClick={() =>
							(window.location.href =
								`mailto:${email}` +
								`?subject=${encodeURIComponent("Service Inquiry")}` +
								`&body=${encodeURIComponent("Hello, I'm interested in your service.")}`)
						}
					>
						Contact Service Provider
					</button>
				</div>
			)}
			{/* <button className={styles.messageButton}>Message service provider</button> */}
			<section>
				{creatorUser && (
					<div>
						{createdByUserId === user?._id && (
							<button className={styles.messageButton} onClick={handleEditProduct}>
								Edit
							</button>
						)}
					</div>
				)}
			</section>
			<section>
				{creatorUser && (
					<div>
						{createdByUserId === user?._id && (
							<button className={styles.deleteButton} onClick={handleDeleteProduct}>
								Delete
							</button>
						)}
					</div>
				)}
			</section>
		</div>
	);
}

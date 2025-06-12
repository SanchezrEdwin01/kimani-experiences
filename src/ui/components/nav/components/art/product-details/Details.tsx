"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { ShareButtonWithModal } from "../../ShareButtonWithModal";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import { type User } from "@/UserKimani/types";
import { useUser } from "@/UserKimani/context/UserContext";
import { API_URL } from "@/UserKimani/utils/constants";
import { executeGraphQL, formatMoneyRange } from "@/lib/graphql";
import {
	ProductDetailsBySlugDocument,
	ProductDeleteDocument,
	UpdateFavoritesDocument,
	type ProductDetailsBySlugQuery,
	type ProductDetailsBySlugQueryVariables,
	type ProductDeleteMutation,
	type ProductDeleteMutationVariables,
	type UpdateFavoritesMutation,
	type UpdateFavoritesMutationVariables,
} from "@/gql/graphql";

interface ProductPageProps {
	slug: string;
	categoryName: string;
}

export function ProductPage({ slug }: ProductPageProps) {
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

	const productImages = product?.media?.map((m) => m.url) || [];

	const externalLink = getAttr("external-link");
	// const certificateUrl = getAttr("certificate-of-authenticity");

	const productName = product?.name || "No name";
	const productDescription = product?.description || "No description available";

	const dimensions = getAttr("dimensions");
	const datePainted = getAttr("date-painted");
	const signature = getAttr("signature");
	const artType = getAttr("art-type");
	const email = getAttr("email");
	const printType = getAttr("name");
	const frame = getAttr("frame");

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

	const createdByUserId: string | null = useMemo(() => {
		if (!product?.metadata) return null;
		const entry = product.metadata.find((m) => m.key === "createdBy");
		return entry ? entry.value : null;
	}, [product?.metadata]);

	if (loading) return <p className={styles.loading}>Loading…</p>;
	if (!product) return <p className={styles.error}>Product not found</p>;

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

	function handleEditProduct() {
		router.push("/marketplace/art/edit-art/" + product?.slug);
	}

	const currentUrl = typeof window !== "undefined" ? window.location.href : "";

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

			<h1 className={styles.title}>{productName}</h1>

			<div className={styles.priceAndLocation}>{formatMoneyRange(range)}</div>
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

			{/* <section className={styles.certificateSection}>
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
			</section> */}

			{/* <button className={styles.messageButton}>Message listing member</button> */}
			{email && (
				<div className={styles.infoItem}>
					<button
						className={styles.messageButton}
						onClick={() =>
							(window.location.href =
								`mailto:${email}` +
								`?subject=${encodeURIComponent("Service Inquiry")}` +
								`&body=${encodeURIComponent("Hello, I'm interested in your listing.")}`)
						}
					>
						Contact Listing Member
					</button>
				</div>
			)}
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

"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { ShareButtonWithModal } from "../../ShareButtonWithModal";
import styles from "./index.module.scss";
import type { DescriptionDoc } from "./types";
import { executeGraphQL, formatMoneyRange } from "@/lib/graphql";
import { type User } from "@/UserKimani/types";
import { useUser } from "@/UserKimani/context/UserContext";
import { API_URL } from "@/UserKimani/utils/constants";
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

	const address = getAttr("address");
	const city = getAttr("city");
	const email = getAttr("email");
	const currentUrl = typeof window !== "undefined" ? window.location.href : "";

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

	const createdByUserId: string | null = useMemo(() => {
		if (!product?.metadata) return null;
		const entry = product.metadata.find((m) => m.key === "createdBy");
		return entry ? entry.value : null;
	}, [product?.metadata]);

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

	function handleEditProduct() {
		router.push("/marketplace/luxury-goods/edit-luxury-goods/" + product?.slug);
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
			{/* <button className={styles.messageButton}>Message listing member</button> */}
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

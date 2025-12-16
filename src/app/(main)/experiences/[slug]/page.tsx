"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import styles from "./index.module.scss";

import { useUser } from "@/UserKimani/context/UserContext";
import { executeGraphQL } from "@/lib/graphql";
import {
	ProductDetailsBySlugDocument,
	type ProductDetailsBySlugQuery,
	type ProductDetailsBySlugQueryVariables,
	ProductDeleteDocument,
	type ProductDeleteMutation,
	type ProductDeleteMutationVariables,
} from "@/gql/graphql";

/* ============================================================
   TYPES
============================================================ */

interface ExperiencePageProps {
	params: {
		slug: string;
	};
}

interface EditorJSBlock {
	type: string;
	data?: {
		text?: string;
	};
}

interface EditorJSContent {
	blocks?: EditorJSBlock[];
}

/* ============================================================
   PAGE
============================================================ */

export default function ExperiencePage({ params }: ExperiencePageProps) {
	const { slug } = params;

	const router = useRouter();
	const pathname = usePathname();
	const { user, isAdmin } = useUser();

	const [product, setProduct] = useState<ProductDetailsBySlugQuery["product"] | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	/* ============================================================
	   FETCH EXPERIENCE
	============================================================ */

	useEffect(() => {
		if (!slug) return;

		void executeGraphQL<ProductDetailsBySlugQuery, ProductDetailsBySlugQueryVariables>(
			ProductDetailsBySlugDocument,
			{
				variables: { slug, channel: "default-channel" },
			},
		)
			.then((res) => setProduct(res.product))
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [slug]);

	/* ============================================================
	   HELPERS
	============================================================ */

	const getAttr = (attrSlug: string): string | undefined =>
		product?.attributes.find((a) => a.attribute.slug === attrSlug)?.values?.[0]?.name ?? undefined;

	const descriptionBlocks = useMemo(() => {
		if (!product?.description) return [];
		try {
			const parsed = JSON.parse(product.description) as EditorJSContent;
			return Array.isArray(parsed.blocks) ? parsed.blocks : [];
		} catch {
			return [{ type: "paragraph", data: { text: product.description } }];
		}
	}, [product?.description]);

	/* ============================================================
	   DATA (EXPERIENCES ATTRIBUTES)
	============================================================ */

	const ownerUserId = getAttr("user-id");
	const email = getAttr("email");

	const isOwner = ownerUserId === user?._id;
	const canEdit = isOwner || isAdmin;

	const images = product?.media?.map((m) => m.url) ?? [];
	const title = product?.name ?? "Experience";

	/* ============================================================
	   ACTIONS
	============================================================ */

	const goBack = () => {
		const parent = pathname.split("/").slice(0, -1).join("/") || "/";
		router.push(parent);
	};

	const handleEdit = () => {
		router.push(`/experiences/edit-experience/${slug}`);
	};

	const handleDelete = async () => {
		if (!product || !canEdit) return;

		const ok = window.confirm("Are you sure you want to delete this experience?");
		if (!ok) return;

		try {
			await executeGraphQL<ProductDeleteMutation, ProductDeleteMutationVariables>(ProductDeleteDocument, {
				variables: { id: product.id },
			});

			goBack();
		} catch (err) {
			console.error(err);
			alert("Failed to delete experience.");
		}
	};

	/* ============================================================
	   STATES
	============================================================ */

	if (loading) {
		return <p className={styles.loading}>Loading…</p>;
	}

	if (!product) {
		return <p className={styles.error}>Experience not found</p>;
	}

	/* ============================================================
	   RENDER
	============================================================ */

	return (
		<div className={styles.container}>
			{/* ================= HERO ================= */}
			<div className={styles.heroWrapper}>
				<Image
					src={images[currentImageIndex] ?? "/placeholder-image.jpg"}
					alt={title}
					fill
					sizes="100vw"
					className={styles.hero}
				/>

				<button className={styles.backBtn} onClick={goBack} aria-label="Back">
					<ArrowLeftIcon />
				</button>

				{images.length > 1 && (
					<div className={styles.galleryNavigation}>
						<button onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}>
							‹
						</button>
						<div className={styles.imageCounter}>
							{currentImageIndex + 1} / {images.length}
						</div>
						<button onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}>
							›
						</button>
					</div>
				)}
			</div>

			{/* ================= TITLE ================= */}
			<h1 className={styles.title}>{title}</h1>

			{/* ================= DESCRIPTION ================= */}
			<section className={styles.descriptionSection}>
				<h2>Description</h2>
				{descriptionBlocks.map(
					(block, idx) => block.type === "paragraph" && <p key={idx}>{block.data?.text}</p>,
				)}
			</section>

			{/* ================= CONTACT ================= */}
			{email && (
				<button className={styles.contactButton} onClick={() => (window.location.href = `mailto:${email}`)}>
					Contact via Email
				</button>
			)}

			{/* ================= ADMIN / OWNER ================= */}
			{canEdit && (
				<div className={styles.adminActions}>
					<button className={styles.editButton} onClick={handleEdit}>
						Edit
					</button>
					<button className={styles.deleteButton} onClick={handleDelete}>
						Delete
					</button>
				</div>
			)}
		</div>
	);
}

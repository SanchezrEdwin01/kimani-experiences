"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import { isReviewItem, type MetadataItem, type ReviewItem } from "./types";
import {
	ProductListByCategoryUniqueDocument,
	type ProductListByCategoryUniqueQuery,
	type ProductListByCategoryUniqueQueryVariables,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export function ProductListByCategory({ slug }: { slug: string }) {
	const router = useRouter();
	const [data, setData] = useState<ProductListByCategoryUniqueQuery | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		executeGraphQL<ProductListByCategoryUniqueQuery, ProductListByCategoryUniqueQueryVariables>(
			ProductListByCategoryUniqueDocument,
			{
				variables: { slug },
				revalidate: 60,
			},
		)
			.then((result) => {
				if (!cancelled) setData(result);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : String(err));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [slug]);

	if (loading) return <p className={styles.loading}>Loading…</p>;
	if (error) return <p className={styles.error}>Error: {error}</p>;

	const edges = data?.category?.products?.edges ?? [];
	const categoryName = data?.category?.name ?? "";

	if (edges.length === 0) {
		return <p className={styles.noProducts}>No products found.</p>;
	}

	return (
		<div className={styles.productListWrapper}>
			{edges.map((edge, idx) => {
				const node = edge?.node;
				if (!node) return null;

				const allMetadata: MetadataItem[] = node.metadata ?? [];
				const reviewsRaw = allMetadata.find((m) => m.key === "reviews")?.value;
				const reviews: ReviewItem[] = [];
				if (typeof reviewsRaw === "string") {
					try {
						const parsed = JSON.parse(reviewsRaw);
						if (Array.isArray(parsed)) {
							parsed.forEach((item) => {
								if (isReviewItem(item)) reviews.push(item);
							});
						}
					} catch (e) {
						console.error("Error parsing reviews metadata:", e);
					}
				}
				const avgRating =
					reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

				let discountValue = allMetadata.find((m) => m.key === "discount")?.value;
				if (!discountValue) {
					const attr = node.attributes?.find((a) => a.attribute && a.attribute.name === "Discount (%)");
					if (attr?.values?.[0]?.name) {
						discountValue = attr.values[0].name;
					}
				}
				if (typeof discountValue === "string" && discountValue.trim() !== "") {
					const clean = discountValue.trim().replace(/%?\s*off$/i, "");
					discountValue = `${clean}% off`;
				}

				return (
					<div
						key={node.id ?? idx}
						className={styles.productListItem}
						onClick={() => router.push(`/experiences/service-providers/sub-categories/${slug}/${node.slug}`)}
					>
						{/* Thumbnail */}
						<div className={styles.thumb}>
							{node.thumbnail?.url && (
								<Image
									src={node.thumbnail.url}
									alt={node.thumbnail.alt ?? node.name}
									width={56}
									height={56}
								/>
							)}
						</div>

						{/* Info */}
						<div className={styles.info}>
							<p className={styles.name}>{node.name}</p>
							<div className={styles.stars}>
								{[1, 2, 3, 4, 5].map((i) => (
									<StarIcon key={i} className={i <= Math.round(avgRating) ? styles.filled : styles.empty} />
								))}
							</div>
							<p className={styles.role}>{categoryName}</p>
						</div>

						{/* Discount */}
						{typeof discountValue === "string" && discountValue.trim() !== "" && (
							<span className={parseFloat(discountValue) > 0 ? styles.discountHighlighted : styles.discount}>
								{discountValue}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}

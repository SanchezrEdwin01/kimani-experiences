import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { SubCategoryProps, SubCategoryNode } from "./types";
import { executeGraphQL } from "@/lib/graphql";
import {
	CategorySubcategoriesDocument,
	type CategorySubcategoriesQuery,
	type CategorySubcategoriesQueryVariables,
} from "@/gql/graphql";
import "./index.scss";

export async function SubCategory({ slug }: SubCategoryProps) {
	const data = await executeGraphQL<CategorySubcategoriesQuery, CategorySubcategoriesQueryVariables>(
		CategorySubcategoriesDocument,
		{
			variables: { slug },
			cache: "no-cache",
		},
	);

	if (!data.category?.children) {
		return (
			<p className="p-8 text-center text-red-400">No subcategories were found for &quot;{slug}&quot;.</p>
		);
	}

	const subcategories = data.category.children.edges.map((e) => e.node as unknown as SubCategoryNode);

	return (
		<div className="subcategories-wrapper">
			<ul className="subcategories-grid two-columns">
				{subcategories.map((sub) => (
					<li key={sub.id} className="subcategories-card">
						<Link href={`/experiences/service-providers/sub-categories/${sub.slug}`} className="card-link">
							<div className="card-image-wrapper">
								{sub.backgroundImage?.url ? (
									<Image
										src={sub.backgroundImage.url}
										alt={sub.backgroundImage.alt || sub.name}
										fill
										sizes="(max-width: 640px) 50vw, 33vw"
										className="card-image"
									/>
								) : (
									<div className="card-image-placeholder">
										<span>{sub.name}</span>
									</div>
								)}
							</div>

							<div className="card-title">{sub.name}</div>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

"use client";

import { CategoryElement } from "./categoryElement";
import type { CategoriesQuery } from "@/gql/graphql";
import "./index.scss";

type CategoryNode = NonNullable<CategoriesQuery["categories"]>["edges"][number]["node"] & {
  parent?: { id: string } | null;
};

export const CategoryList = ({
	categories,
	filterParentId,
	itemSpecificViewRouteValue,
}: {
	categories: readonly CategoryNode[];
	filterParentId?: string | null;
	itemSpecificViewRouteValue?: string;
}) => {
	const displayedCategories = filterParentId
		? categories.filter((category) => (category.parent as { id: string } | null)?.id === filterParentId)
		: categories;

	return (
		<section className="manage-categories-container mt-8 px-6 py-8">

			<ul role="list" data-testid="CategoryList" className="category-list flex flex-col gap-4">
				{displayedCategories.map((category) => (
					<CategoryElement
						key={category.id}
						category={category}
						itemSpecificViewRouteValue={itemSpecificViewRouteValue}
					/>
				))}
			</ul>
		</section>
	);
};

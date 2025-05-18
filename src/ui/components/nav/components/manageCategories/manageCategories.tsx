"use client";

import { CategoryElement } from "./categoryElement";
import type { CategoriesQuery } from "@/gql/graphql";
import "./index.scss";

type CategoryNode = NonNullable<CategoriesQuery["categories"]>["edges"][number]["node"];

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
			{/* El título y el botón de retroceso podrían ser parte de la página contenedora en lugar de la lista */}
			{/* <h2 className="mb-4 text-center text-xl font-bold text-white">Manage Categories</h2> */}
			{/* <button
				onClick={() => void router.back()}
				className="back-button mb-4 flex items-center gap-2 text-xl text-white transition hover:text-black"
			>
				←
			</button> */}

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

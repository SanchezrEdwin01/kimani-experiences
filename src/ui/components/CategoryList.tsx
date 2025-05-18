// src/ui/components/CategoryList.tsx
import { CategoryElement } from "./CategoryElement";
import type { CategoriesQuery } from "@/gql/graphql";

type CategoryNode = NonNullable<CategoriesQuery["categories"]>["edges"][number]["node"];

export const CategoryList = ({ categories }: { categories: readonly CategoryNode[] }) => {
	return (
		<ul
			role="list"
			data-testid="CategoryList"
			className="mx-4 grid grid-cols-2 gap-2 sm:mx-6 sm:grid-cols-2 md:mx-8 lg:grid-cols-2 xl:mx-auto xl:max-w-5xl"
		>
			{categories.map((category) => (
				<CategoryElement key={category.id} category={category} baseRoute="/marketplace/service-providers" />
			))}
		</ul>
	);
};

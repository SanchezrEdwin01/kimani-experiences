"use client";

import { useRouter } from "next/navigation";
import { ManageProviderElement } from "./manageProviderElement";
import type { CategoriesQuery } from "@/gql/graphql";
import "./index.scss";

type CategoryNode = NonNullable<CategoriesQuery["categories"]>["edges"][number]["node"];

export const ManageProvider = ({ categories }: { categories: readonly CategoryNode[] }) => {
	const router = useRouter();
	return (
		<section className="manage-categories-container mt-8 px-6 py-8">
			<h2 className="mb-4 text-center text-xl font-bold text-white">Manage service providers</h2>

			<button
				onClick={() => void router.back()}
				className="back-button mb-4 flex items-center gap-2 text-xl text-white transition hover:text-black"
			>
				←
			</button>

			<ul role="list" data-testid="CategoryList" className="category-list flex flex-col gap-4">
				{categories.map((category) => (
					<ManageProviderElement
						key={category.id}
						category={category}
						baseRoute="/experiences/service-providers"
					/>
				))}
			</ul>
		</section>
	);
};

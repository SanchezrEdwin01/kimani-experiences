"use client";

import { useRouter } from "next/navigation";
import { EventService } from "./eventService";
import type { CategoriesQuery } from "@/gql/graphql";
import "../index.scss";

type CategoryNode = NonNullable<CategoriesQuery["categories"]>["edges"][number]["node"];

export const EventPlaningList = ({ categories }: { categories: readonly CategoryNode[] }) => {
	const router = useRouter();
	return (
		<section className="manage-categories-container mt-8 px-6 py-8">
			<h2 className="mb-4 text-center text-xl font-bold text-white">Event planning services</h2>

			<button
				onClick={() => void router.back()}
				className="back-button mb-4 flex items-center gap-2 text-sm text-xl text-white transition hover:text-black"
			>
				←
			</button>

			<ul role="list" data-testid="CategoryList" className="category-list flex flex-col gap-4">
				{categories.map((category) => (
					<EventService key={category.id} category={category} baseRoute="/experiences/service-providers" />
				))}
			</ul>
		</section>
	);
};

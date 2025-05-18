"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryList } from "@/ui/components/nav/components/manageCategories/manageCategories";
import { ClientFloatingWrapperSub } from "@/ui/components/nav/components/manageCategories/FormSubCategory/FloatButton/FloatingWrapper";
import { Loader } from "@/ui/atoms/Loader";
import { CustomCategoryMessage } from "@/ui/components/nav/components/CustomCategoryMessage";
import {
	SubcategoriesBySlugDocument,
	type SubcategoriesBySlugQuery,
	type SubcategoriesBySlugQueryVariables,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import {
	REAL_ESTATE_CATEGORY_SLUG,
	ADMIN_REAL_ESTATE_CATEGORY_CONTENT_VALUE,
	TYPES,
	ADMIN_REAL_ESTATE_SUBCATEGORY_CREATE_PAGE_VALUE,
} from "@/checkout/utils/constants";

type CategoryChildrenConnection = NonNullable<SubcategoriesBySlugQuery["category"]>["children"];
type CategoryEdge = NonNullable<CategoryChildrenConnection>["edges"][number];
type CategoryNode = CategoryEdge["node"];

export default function AdminRealEstateCategoriesPage() {
	const router = useRouter();
	const [realEstateParentCategoryId, setRealEstateParentCategoryId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [categories, setCategories] = useState<readonly CategoryNode[]>([]);

	useEffect(() => {
		async function fetchRealEstateCategoryAndSubcategories() {
			setLoading(true);
			try {
				const data = await executeGraphQL<SubcategoriesBySlugQuery, SubcategoriesBySlugQueryVariables>(
					SubcategoriesBySlugDocument,
					{ variables: { slug: REAL_ESTATE_CATEGORY_SLUG } },
				);

				if (data.category?.id) {
					setRealEstateParentCategoryId(data.category.id);
					const realEstateSubCategories =
						data.category.children?.edges.map((edge) => edge.node).filter(Boolean) ?? [];
					setCategories(realEstateSubCategories);
				} else {
					console.error("Real Estate parent category not found or has no children");
					setCategories([]);
				}
			} catch (error) {
				console.error("Error fetching Real Estate category data:", error);
				setCategories([]);
			} finally {
				setLoading(false);
			}
		}
		void fetchRealEstateCategoryAndSubcategories();
	}, []);

	if (loading && !categories.length && !realEstateParentCategoryId) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader />
			</div>
		);
	}

	const createSubCategoryRoute = TYPES.find(
		(type) => type.value === ADMIN_REAL_ESTATE_SUBCATEGORY_CREATE_PAGE_VALUE,
	)?.route;

	return (
		<ClientFloatingWrapperSub
			parent={realEstateParentCategoryId || ""}
			baseCreateRoute={createSubCategoryRoute ? `/${createSubCategoryRoute}` : undefined}
		>
			<div className="manage-categories-container relative z-10 mt-8 px-6 py-8">
				<CustomCategoryMessage text="Manage destination areas" />
				<button
					onClick={() => router.back()}
					className="back-button mb-4 flex items-center gap-2 text-xl text-white transition hover:text-black"
				>
					←
				</button>
				{loading ? (
					<div className="flex h-64 items-center justify-center">
						<Loader />
					</div>
				) : categories.length > 0 ? (
					<CategoryList
						categories={categories}
						itemSpecificViewRouteValue={ADMIN_REAL_ESTATE_CATEGORY_CONTENT_VALUE}
					/>
				) : (
					<p className="text-center text-white">No Real Estate categories found.</p>
				)}
			</div>
		</ClientFloatingWrapperSub>
	);
}

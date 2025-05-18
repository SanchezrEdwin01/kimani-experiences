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
	LUXURY_GOODS_CATEGORY_SLUG,
	ADMIN_LUXURY_GOODS_CATEGORY_CONTENT_VALUE,
	TYPES,
	ADMIN_LUXURY_GOODS_SUBCATEGORY_CREATE_PAGE_VALUE,
} from "@/checkout/utils/constants";

type CategoryChildrenConnection = NonNullable<SubcategoriesBySlugQuery["category"]>["children"];
type CategoryEdge = NonNullable<CategoryChildrenConnection>["edges"][number];
type CategoryNode = CategoryEdge["node"];

export default function AdminLuxuryGoodsCategoriesPage() {
	const router = useRouter();
	const [luxuryGoodsParentCategoryId, setLuxuryGoodsParentCategoryId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [categories, setCategories] = useState<readonly CategoryNode[]>([]);

	useEffect(() => {
		async function fetchLuxuryGoodsCategoryAndSubcategories() {
			setLoading(true);
			try {
				const data = await executeGraphQL<SubcategoriesBySlugQuery, SubcategoriesBySlugQueryVariables>(
					SubcategoriesBySlugDocument,
					{ variables: { slug: LUXURY_GOODS_CATEGORY_SLUG } },
				);

				if (data.category?.id) {
					setLuxuryGoodsParentCategoryId(data.category.id);
					const luxuryGoodsSubCategories =
						data.category.children?.edges.map((edge) => edge.node).filter(Boolean) ?? [];
					setCategories(luxuryGoodsSubCategories);
				} else {
					console.error("Luxury Goods parent category not found or has no children");
					setCategories([]);
				}
			} catch (error) {
				console.error("Error fetching Luxury Goods category data:", error);
				setCategories([]);
			} finally {
				setLoading(false);
			}
		}
		void fetchLuxuryGoodsCategoryAndSubcategories();
	}, []);

	if (loading && !categories.length && !luxuryGoodsParentCategoryId) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader />
			</div>
		);
	}

	const createSubCategoryRoute = TYPES.find(
		(type) => type.value === ADMIN_LUXURY_GOODS_SUBCATEGORY_CREATE_PAGE_VALUE,
	)?.route;

	return (
		<ClientFloatingWrapperSub
			parent={luxuryGoodsParentCategoryId || ""}
			baseCreateRoute={createSubCategoryRoute ? `/${createSubCategoryRoute}` : undefined}
		>
			<div className="manage-categories-container mt-8 px-6 py-8">
				<CustomCategoryMessage text="Manage Luxury Goods Categories" />
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
						itemSpecificViewRouteValue={ADMIN_LUXURY_GOODS_CATEGORY_CONTENT_VALUE}
					/>
				) : (
					<p className="text-center text-white">No Luxury Goods categories found.</p>
				)}
			</div>
		</ClientFloatingWrapperSub>
	);
}

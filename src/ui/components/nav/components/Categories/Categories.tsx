"use client";
import { useRouter } from "next/navigation";
import { TYPES } from "@/checkout/utils/constants";

export const Category = () => {
	const router = useRouter();

	const handleClick = () => {
		const subCategoryType = TYPES.find((t) => t.value === "sub-categories");
		const slug = "main-category";
		if (subCategoryType?.route) {
			const to = `${subCategoryType.route}?slug=${encodeURIComponent(slug)}`;
			void router.push(to);
		}
	};

	return (
		<div
			className="flex h-full w-full items-center justify-center"
			onClick={handleClick}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => (e.key === "Enter" ? handleClick() : null)}
		>
			<div className="flex h-1/2 w-1/2 cursor-pointer items-center justify-center rounded-lg bg-white p-4 shadow-lg transition hover:shadow-xl">
				<h1 className="text-2xl font-bold text-gray-800">Categories</h1>
			</div>
		</div>
	);
};

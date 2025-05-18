"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NewSubCategoryForm } from "@/ui/components/nav/components/manageCategories/FormSubCategory/NewSubCategoryForm";
import { Loader } from "@/ui/atoms/Loader";

function CreateArtSubCategoryContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const parentId = searchParams.get("parent");

	if (!parentId) {
		return <p className="p-4 text-center text-red-500">Parent category ID is missing.</p>;
	}

	return (
		<div className="bg-white-900 min-h-screen p-4">
			<button
				onClick={() => router.back()}
				className="mb-4 flex items-center gap-2 text-xl text-white transition hover:text-gray-300"
			>
				← Back
			</button>
			<NewSubCategoryForm initialParent={parentId} hideImageField={true} />
		</div>
	);
}

export default function CreateArtSubCategoryPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center">
					<Loader />
				</div>
			}
		>
			<CreateArtSubCategoryContent />
		</Suspense>
	);
}

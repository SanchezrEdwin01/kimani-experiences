// src/ui/components/CategoryElement.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { type CategoryFragment } from "@/gql/graphql";
import { TYPES, ADMIN_EVENT_PLANNING } from "@/checkout/utils/constants";
import { useDeleteCategory } from "@/checkout/hooks/useDeleteCategory";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";

export function CategoryElement({
	category,
	loading = "lazy",
	itemSpecificViewRouteValue,
}: {
	category: CategoryFragment;
	loading?: "eager" | "lazy";
	itemSpecificViewRouteValue?: string;
}) {
	const router = useRouter();
	const { deleteCategory, isDeleting } = useDeleteCategory();
	const [showConfirm, setShowConfirm] = useState(false);

	const handleView = () => {
		const routeValue = itemSpecificViewRouteValue || ADMIN_EVENT_PLANNING;
		const routeConfig = TYPES.find((type) => type.value === routeValue);

		if (routeConfig) {
			void router.push(`/${routeConfig.route}?parent=${category.id}`);
		} else {
			console.warn(`Route configuration not found for value: ${routeValue}`);
		}
	};

	const handleDelete = () => {
		setShowConfirm(true);
	};

	return (
		<>
			<li
				data-testid="CategoryElement"
				className="flex items-center justify-between gap-4 rounded-xl bg-[#2E2C2C] p-4 shadow transition hover:shadow-md"
			>
				<div className="flex-shrink-0">
					{category.backgroundImage?.url && (
						<Image
							src={category.backgroundImage.url}
							alt={category.backgroundImage.alt || category.name}
							width={64}
							height={64}
							className="h-16 w-16 rounded object-cover"
							loading={loading}
						/>
					)}
				</div>

				<div className="flex-grow text-white">
					<h3 className="break-words text-base font-medium">{category.name}</h3>
				</div>

				<button
					onClick={handleView}
					className="rounded bg-[#fcc419] px-3 py-2 text-sm font-semibold text-black transition hover:brightness-105"
				>
					View
				</button>

				<button
					onClick={handleDelete}
					className="rounded px-1 py-1 text-sm font-semibold text-white transition hover:text-red-500"
					aria-label={`Delete ${category.name}`}
					disabled={isDeleting}
				>
					{isDeleting ? "..." : "X"}
				</button>
			</li>

			<ConfirmDialog
				open={showConfirm}
				title="Confirm Deletion"
				message={`Are you sure you want to delete "${category.name}"?`}
				onCancel={() => setShowConfirm(false)}
				onConfirm={() => {
					void deleteCategory(category.id, category.name);
					setShowConfirm(false);
				}}
			/>
		</>
	);
}

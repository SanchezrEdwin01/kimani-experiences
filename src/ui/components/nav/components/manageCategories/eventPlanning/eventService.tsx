import Image from "next/image";
import React, { useState } from "react";
import { type CategoryFragment } from "@/gql/graphql";
import { useDeleteCategory } from "@/checkout/hooks/useDeleteCategory";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";

export function EventService({
	category,
	loading = "lazy",
}: {
	category: CategoryFragment;
	baseRoute?: string;
	loading?: "eager" | "lazy";
}) {
	const { deleteCategory, isDeleting } = useDeleteCategory();
	const [showConfirm, setShowConfirm] = useState(false);

	const handleDelete = () => setShowConfirm(true);

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
					<h3 className="break-words text-base">{category.name}</h3>
				</div>

				<button
					onClick={handleDelete}
					className="rounded px-1 py-1 text-sm font-semibold text-white transition hover:text-red-500"
					aria-label={`Eliminar ${category.name}`}
					disabled={isDeleting}
				>
					{isDeleting ? "..." : "X"}
				</button>
			</li>
			<ConfirmDialog
				open={showConfirm}
				title="Confirmar eliminación"
				message={`¿Estás seguro de que deseas eliminar "${category.name}"?`}
				onCancel={() => setShowConfirm(false)}
				onConfirm={() => {
					void deleteCategory(category.id, category.name);
					setShowConfirm(false);
				}}
			/>
		</>
	);
}

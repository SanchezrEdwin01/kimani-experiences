"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { executeGraphQL } from "@/lib/graphql";
import { DeleteCategoryDocument } from "@/gql/graphql";

export const useDeleteCategory = () => {
	const [isDeleting, setIsDeleting] = useState(false);
	const refreshPage = () => window.location.reload();

	const deleteCategory = async (id: string, name: string) => {
		setIsDeleting(true);
		try {
			const result = await executeGraphQL(DeleteCategoryDocument, { variables: { id } });
			if (result.categoryDelete?.errors?.length) {
				const msg = result.categoryDelete.errors.map((e) => e.message).join(", ");
				toast.error(`Error deleting the category: ${msg}`);
			} else {
				toast.success(`The category "${name}" has been deleted`);
				refreshPage();
			}
		} catch (error) {
			toast.error(`Error deleting the category: ${error instanceof Error ? error.message : "Unknown"}`);
		} finally {
			setIsDeleting(false);
		}
	};

	return { deleteCategory, isDeleting };
};

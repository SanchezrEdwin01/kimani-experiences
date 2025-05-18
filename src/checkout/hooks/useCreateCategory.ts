import { useState } from "react";
import {
	CreateTopCategoryDocument,
	type CreateTopCategoryMutation,
	type CreateTopCategoryMutationVariables,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export function useCreateCategory() {
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
	const [success, setSuccess] = useState(false);

	async function createCategory(input: {
		name: string;
		slug: string;
		seoTitle?: string;
		seoDescription?: string;
	}): Promise<string | undefined> {
		setLoading(true);
		setErrors([]);
		setSuccess(false);

		try {
			const result = await executeGraphQL<CreateTopCategoryMutation, CreateTopCategoryMutationVariables>(
				CreateTopCategoryDocument,
				{
					variables: {
						name: input.name,
						slug: input.slug,
						seoTitle: input.seoTitle || null,
						seoDescription: input.seoDescription || null,
					},
				},
			);

			const newId = result.categoryCreate?.category?.id;

			if (result.categoryCreate?.errors && result.categoryCreate.errors.length > 0) {
				// Convert potential nullable fields to non-nullable as required by state type
				const formattedErrors = result.categoryCreate.errors.map((error) => ({
					field: error.field || "unknown",
					message: error.message || "Unknown error",
				}));
				setErrors(formattedErrors);
				return;
			} else {
				setSuccess(true);
				return newId!;
			}
		} catch (error) {
			console.error("Error creating category:", error);
			setErrors([{ field: "general", message: "An unexpected error occurred" }]);
		} finally {
			setLoading(false);
		}
	}

	return { createCategory, loading, errors, success };
}

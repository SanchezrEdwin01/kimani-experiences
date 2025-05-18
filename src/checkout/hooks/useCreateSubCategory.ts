import { useState } from "react";
import {
	CreateSubCategoryDocument,
	type CreateSubCategoryMutation,
	type CreateSubCategoryMutationVariables,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

type SubCategoryError = { field: string; message: string };
export type CreateSubCategoryInput = {
	name: string;
	slug: string;
	seoTitle?: string;
	seoDescription?: string;
	parent?: string;
};
export type UseCreateSubCategoryReturn = {
	createSubCategory(input: CreateSubCategoryInput): Promise<string | undefined>;
	loading: boolean;
	errors: SubCategoryError[];
	success: boolean;
};

export function useCreateSubCategory(this: void): UseCreateSubCategoryReturn {
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<SubCategoryError[]>([]);
	const [success, setSuccess] = useState(false);

	const createSubCategory = async (input: CreateSubCategoryInput): Promise<string | undefined> => {
		setLoading(true);
		setErrors([]);
		setSuccess(false);
		try {
			const res = await executeGraphQL<CreateSubCategoryMutation, CreateSubCategoryMutationVariables>(
				CreateSubCategoryDocument,
				{
					variables: {
						name: input.name,
						slug: input.slug,
						seoTitle: input.seoTitle ?? null,
						seoDescription: input.seoDescription ?? null,
						parent: input.parent ?? null,
					},
				},
			);
			const newId = res.categoryCreate?.category?.id;
			if (!res.categoryCreate) {
				setErrors([{ field: "", message: "No response from server" }]);
				return;
			}
			if (res.categoryCreate.errors.length) {
				setErrors(
					res.categoryCreate.errors.map((err) => ({
						field: err.field ?? "",
						message: err.message ?? "",
					})),
				);
				return;
			}
			setSuccess(true);
			return newId!;
		} catch (err) {
			setErrors([
				{
					field: "",
					message: err instanceof Error ? err.message : String(err),
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	return { createSubCategory, loading, errors, success };
}

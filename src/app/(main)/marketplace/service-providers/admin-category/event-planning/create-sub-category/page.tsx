import { NewSubCategoryForm } from "@/ui/components/nav/components/manageCategories/FormSubCategory/NewSubCategoryForm";

export default function Page({ searchParams }: { searchParams: { parent?: string } }) {
	const initialParent = searchParams.parent ?? "";
	return <NewSubCategoryForm initialParent={initialParent} />;
}

"use client";

import React, { useState, useEffect } from "react";
import styles from "./NewSubCategoryForm.module.scss";
import { useCreateSubCategory } from "@/checkout/hooks/useCreateSubCategory";
import { uploadGraphQL } from "@/lib/graphql";
import { AddCategoryImageDocument, type TypedDocumentString } from "@/gql/graphql";

export function NewSubCategoryForm({
	initialParent = "",
	hideImageField = false,
}: {
	initialParent?: string;
	hideImageField?: boolean;
}): JSX.Element {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const parent = initialParent;
	const [file, setFile] = useState<File | null>(null);
	const [altText, setAltText] = useState("");

	const formatSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "_");

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setName(val);
		setSlug(formatSlug(val));
	};

	const subCategoryHook = useCreateSubCategory();
	const { loading, errors, success } = subCategoryHook;
	const createSubCategory = (params: { name: string; slug: string; parent: string }) =>
		subCategoryHook.createSubCategory(params);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		const newId = await createSubCategory({ name, slug, parent });
		if (newId && file && !hideImageField) {
			await uploadGraphQL(
				AddCategoryImageDocument as TypedDocumentString<unknown, { id: string; image: File; alt: string }>,
				{ id: newId, image: file, alt: altText },
			);
		}
	};

	useEffect(() => {
		console.log("initialParent:", initialParent);
	}, [initialParent]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		if (e.target.files?.[0]) setFile(e.target.files[0]);
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit}>
			<h2 className={styles.title}>Create New Subcategory</h2>

			<div className={styles.field}>
				<label htmlFor="name">Name *</label>
				<input id="name" type="text" value={name} required onChange={handleNameChange} />
			</div>

			{/* El campo Slug se oculta */}
			{/* <div className={styles.field}>
				<label htmlFor="slug">Slug *</label>
				<input id="slug" type="text" value={slug} required readOnly />
			</div> */}

			{/* El campo Parent Category ID se oculta */}
			{/* <div className={styles.field}>
				<label htmlFor="parent">Parent Category ID</label>
				<input
					id="parent"
					type="text"
					value={parent}
					onChange={handleParentChange}
					readOnly={!!initialParent}
					placeholder="e.g. Q2F0ZWdvcnk6Mw=="
				/>
			</div> */}

			{!hideImageField && (
				<>
					<div className={styles.field}>
						<label htmlFor="image">Imagen</label>
						<input id="image" type="file" accept="image/*" onChange={handleFileChange} />
					</div>

					<div className={styles.field}>
						<label htmlFor="alt">Alt text</label>
						<input id="alt" type="text" value={altText} onChange={(e) => setAltText(e.target.value)} />
					</div>
				</>
			)}

			<button className={styles.button} type="submit" disabled={loading}>
				{loading ? "Creating…" : "Create subcategory"}
			</button>

			{errors.length > 0 && (
				<ul className={styles.errors}>
					{errors.map((err, i) => (
						<li key={i}>
							<strong>{err.field}</strong>: {err.message}
						</li>
					))}
				</ul>
			)}

			{success && <p className={styles.success}>Subcategory created successfully!</p>}
		</form>
	);
}

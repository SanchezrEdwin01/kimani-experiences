"use client";

import React, { useState } from "react";
import styles from "./index.module.scss";
import { useCreateSubCategory } from "@/checkout/hooks/useCreateSubCategory";
import { uploadGraphQL } from "@/lib/graphql";
import { AddCategoryImageDocument, type TypedDocumentString } from "@/gql/graphql";

export function NewCategoryForm() {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) setFile(e.target.files[0]);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const newId = await createSubCategory({ name, slug, parent: "Q2F0ZWdvcnk6MzE=" });
		if (newId && file) {
			await uploadGraphQL(
				AddCategoryImageDocument as TypedDocumentString<unknown, { id: string; image: File; alt: string }>,
				{ id: newId, image: file, alt: altText },
			);
		}
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit}>
			<h2 className="mb-4 text-center text-xl font-bold text-white">Create New Category</h2>

			<div className={styles.field}>
				<label htmlFor="name">Name *</label>
				<input id="name" type="text" value={name} required onChange={handleNameChange} />
			</div>

			<div className={styles.field}>
				<label htmlFor="image">Imagen</label>
				<input id="image" type="file" accept="image/*" onChange={handleFileChange} />
			</div>

			<div className={styles.field}>
				<label htmlFor="alt">Alt text</label>
				<input id="alt" type="text" value={altText} onChange={(e) => setAltText(e.target.value)} />
			</div>

			<button className={styles.button} type="submit" disabled={loading}>
				{loading ? "Creating…" : "Create category"}
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

			{success && <p className={styles.success}>Category created successfully!</p>}
		</form>
	);
}

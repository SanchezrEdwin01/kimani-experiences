"use client";

import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import slugify from "slugify";
import Lottie from "lottie-react";
import styles from "./ArtworkForm.module.scss";
import { executeGraphQL, uploadGraphQL } from "@/lib/graphql";
import {
	CategoryTreeDocument,
	CreateServiceProductDocument,
	CreateDefaultVariantDocument,
	PublishProductInChannelDocument,
	PublishVariantInChannelDocument,
	AddProductToCollectionDocument,
	AddServiceImageDocument,
	type CategoryTreeQuery,
} from "@/gql/graphql";
import successAnimation from "@/ui/components/nav/components/animation/Animation - 1747544233336.json";

interface ArtFormData {
	title: string;
	painterName: string;
	artCategory: string;
	price: string;
	currency: string;
	artType: string;
	dimensions: string;
	unit: "cm" | "in";
	printType: string;
	numberOfPrints: string;
	datePainted: string;
	frame: string;
	collection: string;
	signature: boolean;
	description: string;
	externalLink: string;
	certificateFile?: File;
}

export function ArtForm() {
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [categories, setCategories] = useState<
		{
			id: string;
			name: string;
			slug: string;
			grandchildren: { id: string; name: string; slug: string }[];
		}[]
	>([]);
	const [form, setForm] = useState<ArtFormData>({
		title: "",
		painterName: "",
		artCategory: "",
		price: "",
		currency: "",
		artType: "",
		dimensions: "",
		unit: "cm",
		printType: "",
		numberOfPrints: "",
		datePainted: "",
		frame: "",
		collection: "",
		signature: false,
		description: "",
		externalLink: "",
		certificateFile: undefined,
	});
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
		const { name, value, type } = e.target;
		setFieldErrors((f) => ({ ...f, [name]: "" }));
		const checked =
			type === "checkbox" && "checked" in e.target ? (e.target as HTMLInputElement).checked : undefined;
		setForm((f) => ({
			...f,
			[name]: type === "checkbox" ? checked : value,
		}));
		if (submitted) {
			const isValueValid = typeof value === "string" ? value.trim() !== "" : value !== "" && value !== null;

			if (isValueValid) {
				setFieldErrors((f) => {
					const newErrors = { ...f };
					delete newErrors[name];
					return newErrors;
				});
			}
		}
	}

	const [selectedCategory, setSelectedCategory] = useState<string>("");

	useEffect(() => {
		executeGraphQL<CategoryTreeQuery, { slug: string }>(CategoryTreeDocument, {
			variables: { slug: "art" },
		})
			.then((data) => {
				if (!data.category) return;

				const result =
					data.category.children?.edges.map(({ node }) => ({
						id: node.id,
						name: node.name,
						slug: node.slug,
						grandchildren:
							node.children?.edges.map(({ node: grand }) => ({
								id: grand.id,
								name: grand.name,
								slug: grand.slug,
							})) || [],
					})) || [];

				setCategories(result);
			})
			.catch(console.error);
	}, []);

	function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
		setSelectedCategory(e.target.value);
		setForm((prev) => ({ ...prev, artCategory: e.target.value }));
	}
	function validateForm(): boolean {
		const errors: Record<string, string> = {};
		const requiredFields: { key: keyof ArtFormData; label: string }[] = [
			{ key: "title", label: "Title" },
			{ key: "painterName", label: "Painter Name" },
			{ key: "artCategory", label: "Category" },
			{ key: "price", label: "Price" },
			{ key: "currency", label: "Currency" },
			{ key: "artType", label: "Art Type" },
			{ key: "dimensions", label: "Dimensions" },
			{ key: "unit", label: "Unit" },
			{ key: "printType", label: "Print Type" },
			{ key: "numberOfPrints", label: "Number of Prints" },
			{ key: "datePainted", label: "Date Painted" },
			{ key: "frame", label: "Frame" },
			{ key: "collection", label: "Collection" },
			{ key: "description", label: "Description" },
			{ key: "externalLink", label: "External Link" },
		];

		requiredFields.forEach(({ key, label }) => {
			if (!form[key] || form[key].toString().trim() === "") {
				errors[key] = `${label} is required.`;
			}
		});

		if (form.price && form.price.trim() === "") {
			errors["price"] = "Price is required.";
		}

		if (filesToUpload.length === 0) {
			errors["images"] = "At least one image is required.";
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitted(true);
		if (!validateForm()) return;
		const descriptionJSON = JSON.stringify({
			blocks: [{ type: "paragraph", data: { text: form.description } }],
			version: "2.0",
		});

		const createVars = {
			name: form.title,
			slug: slugify(form.title, { lower: true }),
			productType: "UHJvZHVjdFR5cGU6NQ==",
			category: form.artCategory,
			description: descriptionJSON,
			attributes: [
				{ id: "QXR0cmlidXRlOjk=", boolean: form.signature }, // allow-direct-messaging (si aplica)
				{ id: "QXR0cmlidXRlOjQx", plainText: form.currency }, // currency → ID corregido
				{ id: "QXR0cmlidXRlOjMw", plainText: form.painterName }, // painter-name
				{ id: "QXR0cmlidXRlOjQy", plainText: form.artType }, // art-type
				{ id: "QXR0cmlidXRlOjQz", plainText: form.printType }, // print-type
				{ id: "QXR0cmlidXRlOjQ0", plainText: form.frame }, // frame
				{ id: "QXR0cmlidXRlOjM3", plainText: form.collection }, // collection
				{ id: "QXR0cmlidXRlOjM4", plainText: form.externalLink }, // link-to-artwork
				{ id: "QXR0cmlidXRlOjM0", numeric: form.numberOfPrints || "1" }, // number-of-prints
				{ id: "QXR0cmlidXRlOjMy", plainText: form.dimensions }, // dimensions
				{ id: "QXR0cmlidXRlOjM1", plainText: form.datePainted }, // date-painted
				{ id: "QXR0cmlidXRlOjI1", plainText: form.description },
				{ id: "QXR0cmlidXRlOjIy", plainText: "0" },
			],
		};

		const createRes = await executeGraphQL(CreateServiceProductDocument, { variables: createVars });
		const productId = createRes.productCreate?.product?.id;
		if (!productId) {
			console.error(createRes.productCreate?.errors);
			return;
		}

		const variantRes = await executeGraphQL(CreateDefaultVariantDocument, {
			variables: { productId, sku: `${createVars.slug}-DEFAULT` },
		});
		const variantId = variantRes.productVariantCreate?.productVariant?.id;
		if (!variantId) {
			console.error(variantRes.productVariantCreate?.errors);
			return;
		}

		await executeGraphQL(PublishProductInChannelDocument, {
			variables: { productId, channelId: "Q2hhbm5lbDox" },
		});
		await executeGraphQL(PublishVariantInChannelDocument, {
			variables: {
				variantId,
				channelId: "Q2hhbm5lbDox",
				price: parseFloat(form.price),
			},
		});

		await executeGraphQL(AddProductToCollectionDocument, {
			variables: { collectionId: "Q29sbGVjdGlvbjoyMDU=", productId },
		});

		for (const file of filesToUpload) {
			await uploadGraphQL(AddServiceImageDocument, {
				product: productId,
				image: file,
				alt: form.title,
			});
		}
		setShowSuccess(true);
		setTimeout(() => setShowSuccess(false), 5000);
		console.log("Artwork created with ID", productId);
	}

	function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files || e.target.files.length === 0) return;
		const newFiles = Array.from(e.target.files);
		setFilesToUpload((prev) => [...prev, ...newFiles]);
		e.target.value = "";
		if (submitted && newFiles.length > 0) {
			setFieldErrors((prev) => {
				const newfieldErrors = { ...prev };
				delete newfieldErrors["images"];
				return newfieldErrors;
			});
		}
	}

	function handleRemove(idxToRemove: number) {
		setFilesToUpload((prev) => prev.filter((_, i) => i !== idxToRemove));
	}

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			{/* Imagen */}
			<div className={`${styles.imageUpload} ${filesToUpload.length ? styles.hasImages : ""}`}>
				{filesToUpload.map((file, idx) => {
					const objectUrl = URL.createObjectURL(file);
					return (
						<div className={styles.thumbWrapper} key={idx}>
							<button type="button" className={styles.deleteButton} onClick={() => handleRemove(idx)}>
								×
							</button>
							<Image
								src={objectUrl}
								alt={`Image ${idx + 1}`}
								width={700}
								height={400}
								className={styles.thumbnail}
							/>
						</div>
					);
				})}
				<div className={styles.thumbWrapper}>
					<button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadButton}>
						＋
					</button>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*"
					onChange={handleFilesChange}
					style={{ display: "none" }}
				/>
			</div>
			{submitted && fieldErrors.images && <small className={styles.errorText}>{fieldErrors.images}</small>}
			<div className={styles.formGroup}>
				{submitted && fieldErrors.title && <small className={styles.errorText}>{fieldErrors.title}</small>}
				<input
					type="text"
					name="title"
					value={form.title}
					onChange={(e) => {
						handleChange(e);
						setForm((prev) => ({ ...prev, title: e.target.value }));
					}}
					placeholder="Artwork title"
				/>
			</div>

			<div className={styles.formGroup}>
				{submitted && fieldErrors.painterName && (
					<small className={styles.errorText}>{fieldErrors.painterName}</small>
				)}
				<input
					name="painterName"
					value={form.painterName}
					onChange={handleChange}
					placeholder="Painter name"
				/>
			</div>

			<div className={styles.formGroup}>
				{submitted && fieldErrors.artCategory && (
					<small className={styles.errorText}>{fieldErrors.artCategory}</small>
				)}
				<select
					name="artCategory"
					value={selectedCategory}
					onChange={(e) => {
						handleCategoryChange(e);
						handleChange(e);
					}}
				>
					<option value="" disabled>
						Select category
					</option>
					{categories.map((cat) => (
						<option key={cat.id} value={cat.id}>
							{cat.name}
						</option>
					))}
				</select>
			</div>

			<div className={styles.formRow}>
				<div className={`${styles.formGroup} ${styles.dimensionsGroup}`}>
					{submitted && fieldErrors.price && <small className={styles.errorText}>{fieldErrors.price}</small>}
					<input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price" />
				</div>
				<div className={`${styles.formGroup} ${styles.unitGroup}`}>
					{submitted && fieldErrors.currency && (
						<small className={styles.errorText}>{fieldErrors.currency}</small>
					)}
					<select name="currency" value={form.currency} onChange={handleChange}>
						<option value="" disabled>
							Currency
						</option>
						<option value="USD">USD</option>
						<option value="EUR">EUR</option>
					</select>
				</div>
			</div>

			<hr className={styles.fullWidthSeparator} />

			<h3 className={styles.sectionTitle}>Artwork details</h3>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.artType && (
					<small className={styles.errorText}>{fieldErrors.artType}</small>
				)}
				<input
					type="text"
					name="artType"
					placeholder="Art type"
					value={form.artType}
					onChange={handleChange}
				/>
			</div>
			<div className={styles.formRow}>
				<div className={`${styles.formGroup} ${styles.dimensionsGroup}`}>
					{submitted && fieldErrors.dimensions && (
						<small className={styles.errorText}>{fieldErrors.dimensions}</small>
					)}
					<input
						type="text"
						name="dimensions"
						value={form.dimensions}
						onChange={handleChange}
						placeholder="Dimensions"
						className={styles.dimensionsInput}
					/>
				</div>
				<div className={`${styles.formGroup} ${styles.unitGroup}`}>
					<select>
						<option value="cm">cm</option>
						<option value="in">in</option>
					</select>
				</div>
			</div>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.printType && (
					<small className={styles.errorText}>{fieldErrors.printType}</small>
				)}
				<select name="printType" value={form.printType} onChange={handleChange}>
					<option value="">Selecciona Art type</option>
					<option value="Q2hvaWNlOjE=">Oil</option>
					<option value="Q2hvaWNlOjI=">Watercolor</option>
				</select>
			</div>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.numberOfPrints && (
					<small className={styles.errorText}>{fieldErrors.numberOfPrints}</small>
				)}
				<input
					type="number"
					name="numberOfPrints"
					value={form.numberOfPrints}
					onChange={handleChange}
					placeholder="Number of prints (optional)"
				/>
			</div>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.datePainted && (
					<small className={styles.errorText}>{fieldErrors.datePainted}</small>
				)}
				<input
					type="text"
					name="datePainted"
					value={form.datePainted}
					onChange={handleChange}
					placeholder="Date painted"
				/>
			</div>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.frame && <small className={styles.errorText}>{fieldErrors.frame}</small>}
				<input type="text" name="frame" value={form.frame} onChange={handleChange} placeholder="Frame" />
			</div>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.collection && (
					<small className={styles.errorText}>{fieldErrors.collection}</small>
				)}
				<input
					type="text"
					name="collection"
					value={form.collection}
					onChange={handleChange}
					placeholder="Collection"
				/>
			</div>

			<div className={styles.formGroup}>
				{submitted && fieldErrors.description && (
					<small className={styles.errorText}>{fieldErrors.description}</small>
				)}
				<textarea
					name="description"
					placeholder="Description"
					rows={4}
					value={form.description}
					onChange={handleChange}
				/>
			</div>

			<hr className={styles.fullWidthSeparator} />

			<h3 className={styles.sectionTitle}>Link to artwork</h3>
			<p className={styles.helperText}>
				You can share the link to other websites where your artwork is listed
			</p>
			<div className={styles.formGroup}>
				{submitted && fieldErrors.externalLink && (
					<small className={styles.errorText}>{fieldErrors.externalLink}</small>
				)}
				<input
					type="url"
					name="externalLink"
					value={form.externalLink}
					onChange={handleChange}
					placeholder="https://"
				/>
			</div>

			{/* <h3 className={styles.sectionTitle}>Certificate of authenticity</h3>
			<div className={styles.formGroup}>
				<button type="button" className={styles.certificateButton}>
					<AddIcon /> Attach a file
				</button>
			</div> */}

			<button type="submit" className={styles.submitButton}>
				Create a listing
			</button>
			{showSuccess && (
				<div className={styles.successWrapper}>
					<Lottie
						animationData={successAnimation}
						loop={false}
						autoplay
						style={{ height: 200, width: 200 }}
					/>
					<p>¡add successfully!</p>
				</div>
			)}
		</form>
	);
}

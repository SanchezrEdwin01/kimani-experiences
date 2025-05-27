"use client";

import React, { useState, useRef, type ChangeEvent, useEffect } from "react";
import slugify from "slugify";
import Image from "next/image";
import { Country, State, City } from "country-state-city";
import styles from "./LuxuryGoodsForm.module.scss";
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
import { executeGraphQL, uploadGraphQL } from "@/lib/graphql";

interface CustomState {
	name: string;
	isoCode: string;
	countryCode: string;
}

interface CustomCity {
	name: string;
	countryCode: string;
	stateCode: string;
}

export function LuxuryGoodsForm() {
	const [form, setForm] = useState({
		title: "",
		category: "",
		city: "",
		zip: "",
		area: "",
		state: "",
		country: "",
		priceOption: "",
		price: "",
		currency: "",
		condition: "",
		description: "",
		externalLink: "",
		brandName: "",
	});
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const [errors, setErrors] = useState<{ imageError?: string }>({});
	const [successMessage, setSuccessMessage] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [countries] = useState(Country.getAllCountries());
	const [states, setStates] = useState<CustomState[]>([]);
	const [cities, setCities] = useState<CustomCity[]>([]);
	const [categories, setCategories] = useState<
		{
			id: string;
			name: string;
			slug: string;
			grandchildren: { id: string; name: string; slug: string }[];
		}[]
	>([]);
	const [_, setSelectedCategory] = useState<string>("");

	useEffect(() => {
		executeGraphQL<CategoryTreeQuery, { slug: string }>(CategoryTreeDocument, {
			variables: { slug: "luxury-goods" },
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

	function handleCategoryChange(e: ChangeEvent<HTMLSelectElement>) {
		const value = e.target.value;
		setSelectedCategory(value);
		setForm((prev) => ({ ...prev, category: value }));
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
		const { name, value } = e.target;

		if (name === "zip") {
			const onlyDigits = value.replace(/\D/g, "");
			setForm((prev) => ({ ...prev, zip: onlyDigits }));
			return;
		}

		if (name === "price") {
			let filtered = value.replace(/[^0-9.]/g, "");
			const parts = filtered.split(".");
			if (parts.length > 2) {
				filtered = parts[0] + "." + parts.slice(1).join("");
			}
			setForm((prev) => ({ ...prev, price: filtered }));
			return;
		}

		setForm((prev) => ({ ...prev, [name]: value }));
	}

	function handlePriceBlur() {
		const num = parseFloat(form.price);
		setForm((prev) => ({
			...prev,
			price: isNaN(num) ? "" : num.toFixed(2),
		}));
	}

	function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files || e.target.files.length === 0) return;
		const newFiles = Array.from(e.target.files);
		setFilesToUpload((prev) => [...prev, ...newFiles]);
		e.target.value = "";
	}

	function handleRemove(idxToRemove: number) {
		setFilesToUpload((prev) => prev.filter((_, i) => i !== idxToRemove));
	}

	function handleCountryChange(e: ChangeEvent<HTMLSelectElement>) {
		const selectedCountry = e.target.value;
		setForm((prev) => ({ ...prev, country: selectedCountry, state: "", city: "" }));

		const countryStates = State.getStatesOfCountry(selectedCountry) || [];
		setStates(countryStates);
		setCities([]);
	}

	function handleStateChange(e: ChangeEvent<HTMLSelectElement>) {
		const selectedState = e.target.value;
		setForm((prev) => ({ ...prev, state: selectedState, city: "" }));

		const stateCities = City.getCitiesOfState(form.country, selectedState) || [];
		setCities(stateCities);
	}

	function handleCityChange(e: ChangeEvent<HTMLSelectElement>) {
		setForm((prev) => ({ ...prev, city: e.target.value }));
	}

	function clearForm() {
		setForm({
			title: "",
			category: "",
			city: "",
			zip: "",
			area: "",
			state: "",
			country: "",
			priceOption: "",
			price: "",
			currency: "",
			condition: "",
			description: "",
			externalLink: "",
			brandName: "",
		});
		setFilesToUpload([]);
		setStates([]);
		setCities([]);
		setErrors({});
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSuccessMessage("");

		if (filesToUpload.length === 0) {
			setErrors((prev) => ({ ...prev, imageError: "At least one image is required" }));
			window.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		setErrors((prev) => ({ ...prev, imageError: undefined }));

		const descriptionJSON = JSON.stringify({
			blocks: [{ type: "paragraph", data: { text: form.description } }],
			version: "2.0",
		});

		const createVars = {
			name: form.title,
			slug: slugify(form.title, { lower: true }),
			productType: "UHJvZHVjdFR5cGU6Mw==",
			category: form.category,
			description: descriptionJSON,
			attributes: [
				{ id: "QXR0cmlidXRlOjEx", plainText: form.city },
				{ id: "QXR0cmlidXRlOjQw", plainText: form.country },
				{ id: "QXR0cmlidXRlOjQ1", plainText: form.state },
				{ id: "QXR0cmlidXRlOjE0", numeric: form.zip },
				{ id: "QXR0cmlidXRlOjQx", plainText: form.currency },
				{ id: "QXR0cmlidXRlOjQ2", plainText: form.condition },
				{ id: "QXR0cmlidXRlOjI1", plainText: form.description },
				{ id: "QXR0cmlidXRlOjIx", plainText: form.brandName },
				{ id: "QXR0cmlidXRlOjIy", plainText: "" },
				{ id: "QXR0cmlidXRlOjE5", plainText: form.externalLink || "" },
			],
		};

		const createRes = await executeGraphQL(CreateServiceProductDocument, {
			variables: createVars,
		});
		const productId = createRes.productCreate?.product?.id;
		if (!productId) return;

		const variantRes = await executeGraphQL(CreateDefaultVariantDocument, {
			variables: { productId, sku: `${createVars.slug}-DEFAULT` },
		});
		const variantId = variantRes.productVariantCreate?.productVariant?.id;
		if (!variantId) return;

		await executeGraphQL(PublishProductInChannelDocument, {
			variables: { productId, channelId: "Q2hhbm5lbDox" },
		});
		await executeGraphQL(PublishVariantInChannelDocument, {
			variables: { variantId, channelId: "Q2hhbm5lbDox", price: parseFloat(form.price) },
		});

		await executeGraphQL(AddProductToCollectionDocument, {
			variables: { collectionId: "Q29sbGVjdGlvbjox", productId },
		});

		if (filesToUpload.length) {
			for (let i = 0; i < filesToUpload.length; i++) {
				await uploadGraphQL(AddServiceImageDocument, {
					product: productId,
					image: filesToUpload[i],
					alt: `${form.title}-${i}`,
				});
			}
		}

		// Show success message and clear form
		setSuccessMessage("Form submitted successfully!");
		clearForm();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			{successMessage && (
				<div
					style={{
						backgroundColor: "#d4edda",
						color: "#155724",
						padding: "10px",
						borderRadius: "4px",
						marginBottom: "20px",
						border: "1px solid #c3e6cb",
					}}
				>
					{successMessage}
				</div>
			)}

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
			{errors.imageError && (
				<p className={styles.errorMessage} style={{ color: "red", marginTop: "5px" }}>
					{errors.imageError}
				</p>
			)}

			<div className={styles.formGroup}>
				<input name="title" value={form.title} onChange={handleChange} placeholder="Title of luxury good" />
			</div>

			<div className={styles.formGroup}>
				<select name="category" value={form.category} onChange={handleCategoryChange}>
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

			<div className={styles.formGroup}>
				<input name="brandName" value={form.brandName} onChange={handleChange} placeholder="Brand name" />
			</div>

			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formRow}>
				<div className={styles.formGroup}>
					<div className={`${styles.sectionTitle} section-title`}>Location details</div>
					<div className={styles.locationContainer}>
						<input
							type="text"
							name="address"
							placeholder="Address"
							onChange={handleChange}
							className={styles.locationInput}
						/>
						<select name="country" onChange={handleCountryChange} className={styles.locationInput}>
							<option value="">Select Country</option>
							{countries.map((c) => (
								<option key={c.isoCode} value={c.isoCode}>
									{c.name}
								</option>
							))}
						</select>
						<select name="state" onChange={handleStateChange} className={styles.locationInput}>
							<option value="">State</option>
							{states.map((s) => (
								<option key={s.isoCode} value={s.isoCode}>
									{s.name}
								</option>
							))}
						</select>

						<div className={styles.cityZipRow}>
							<select
								name="city"
								onChange={handleCityChange}
								disabled={!cities.length}
								className={styles.locationInput}
							>
								<option value="">City</option>
								{cities.map((city) => (
									<option key={city.name} value={city.name}>
										{city.name}
									</option>
								))}
							</select>
							<input
								name="zip"
								type="text"
								inputMode="numeric"
								pattern="\d*"
								placeholder="Zip code"
								value={form.zip}
								onChange={handleChange}
								className={styles.zipCode}
							/>
						</div>
					</div>
				</div>
			</div>

			<h3 className={styles.sectionTitle}>Price details</h3>

			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formGroup}>
				<input
					name="price"
					type="text"
					inputMode="decimal"
					placeholder="Price"
					value={form.price}
					onChange={handleChange}
					onBlur={handlePriceBlur}
					className={styles.priceInput}
				/>
			</div>

			<div className={styles.formGroup}>
				<select name="currency" value={form.currency} onChange={handleChange} defaultValue="">
					<option value="" disabled>
						Currency
					</option>
					<option value="USD">USD</option>
					<option value="EUR">EUR</option>
				</select>
			</div>

			<h3 className={styles.sectionTitle}>Price details</h3>
			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formGroup}>
				<select name="condition" value={form.condition} onChange={handleChange}>
					<option value="" disabled>
						Condition
					</option>
					<option value="new">New</option>
					<option value="like new">Like New</option>
					<option value="refurbished">Refurbished</option>
					<option value="good">Good</option>
					<option value="used">Used</option>
					<option value="vintage">Vintage</option>
				</select>
			</div>

			<div className={styles.formGroup}>
				<textarea
					name="description"
					value={form.description}
					onChange={handleChange}
					rows={4}
					placeholder="Description"
				/>
			</div>

			<h3 className={styles.sectionTitle}>External links</h3>
			<p className={styles.helperText}>
				You can share the link to other websites where your product is listed
			</p>
			<div className={styles.formGroup}>
				<input
					name="externalLink"
					type="url"
					value={form.externalLink}
					onChange={handleChange}
					placeholder="Https://"
				/>
			</div>

			<button type="submit" className={styles.submitButton}>
				Publish listing
			</button>
		</form>
	);
}

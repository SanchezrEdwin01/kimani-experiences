"use client";

import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import { Country, State, City } from "country-state-city";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";
import styles from "./RealEstate.module.scss";
import {
	CategoryTreeDocument,
	type CategoryTreeQuery,
	CreateServiceProductDocument,
	CreateDefaultVariantDocument,
	PublishProductInChannelDocument,
	PublishVariantInChannelDocument,
	AddProductToCollectionDocument,
	AddServiceImageDocument,
} from "@/gql/graphql";
import { executeGraphQL, uploadGraphQL } from "@/lib/graphql";
import { SuccessAnimation } from "@/ui/components/nav/components/animation";

export interface RealEstateFormData {
	title: string;
	category: string;
	address: string;
	city: string;
	zipCode: string;
	externalLink: string;
	userId: string;
	description: string;
	bedrooms: number;
	bathrooms: number;
	country: string;
	currency: string;
	state: string;
	levelListing: string;
	priceOption: string;
	price: string;
	parkingNumber: number;
	propertySize: string;
	sizeUnit: string;
}

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

export function RealEstateForm() {
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [countries] = useState(Country.getAllCountries());
	const [states, setStates] = useState<CustomState[]>([]);
	const [cities, setCities] = useState<CustomCity[]>([]);
	const CONTACT_FOR_PRICE_ID = "QXR0cmlidXRlVmFsdWU6MjIw";
	const [categories, setCategories] = useState<
		{
			id: string;
			name: string;
			slug: string;
			grandchildren: { id: string; name: string; slug: string }[];
		}[]
	>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("");

	const [formData, setFormData] = useState<RealEstateFormData>({
		title: "",
		category: "",
		address: "",
		city: "",
		zipCode: "",
		externalLink: "",
		userId: "",
		description: "",
		bedrooms: 0,
		bathrooms: 0,
		country: "",
		currency: "",
		state: "",
		levelListing: "",
		price: "",
		priceOption: "",
		parkingNumber: 0,
		propertySize: "",
		sizeUnit: "",
	});
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		executeGraphQL<CategoryTreeQuery, { slug: string }>(CategoryTreeDocument, {
			variables: { slug: "real-estate" },
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

	function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files || e.target.files.length === 0) return;
		const newFiles = Array.from(e.target.files);
		setFilesToUpload((prev) => [...prev, ...newFiles]);
		e.target.value = "";

		if (submitted && newFiles.length > 0) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["images"];
				return newErrors;
			});
		}
	}

	useEffect(() => {
		if (formData.priceOption === CONTACT_FOR_PRICE_ID) {
			setFormData((prev) => ({ ...prev, price: "0.0" }));
		}
	}, [formData.priceOption]);

	function handleRemove(idxToRemove: number) {
		setFilesToUpload((prev) => prev.filter((_, i) => i !== idxToRemove));
	}

	function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
		setSelectedCategory(e.target.value);
	}

	function handleCountryChange(e: ChangeEvent<HTMLSelectElement>) {
		const selectedCountry = e.target.value;
		setFormData((prev) => ({ ...prev, country: selectedCountry, state: "", city: "" }));

		if (submitted && selectedCountry) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["country"];
				return newErrors;
			});
		}
		const countryStates = State.getStatesOfCountry(selectedCountry) || [];
		setStates(countryStates);
		setCities([]);
	}

	function handleStateChange(e: ChangeEvent<HTMLSelectElement>) {
		const selectedState = e.target.value;
		setFormData((prev) => ({ ...prev, state: selectedState, city: "" }));

		if (submitted && selectedState) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["state"];
				return newErrors;
			});
		}
		const stateCities = City.getCitiesOfState(formData.country, selectedState) || [];
		setCities(stateCities);
	}

	function handleCityChange(e: ChangeEvent<HTMLSelectElement>) {
		setFormData((prev) => ({ ...prev, city: e.target.value }));
	}

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
		const { name, value, type } = e.target;
		setFieldErrors((prev) => ({ ...prev, [name]: "" }));
		if (name === "priceOption") {
			if (value === CONTACT_FOR_PRICE_ID) {
				setFormData((prev) => ({ ...prev, priceOption: value, price: "0.0" }));
			} else {
				setFormData((prev) => ({ ...prev, priceOption: value, price: "" }));
			}
			return;
		}

		if (name === "zipCode" || name === "price") {
			const filtered = value.replace(/[^0-9]/g, "");
			setFormData((prev) => ({ ...prev, [name]: filtered }));
			return;
		}

		if (name === "propertySize") {
			const filtered = value.replace(/[^0-9.]/g, "");
			setFormData((prev) => ({ ...prev, [name]: filtered }));
			return;
		}

		setFormData((prev) => ({
			...prev,
			[name]: type === "number" ? parseFloat(value) || 0 : value,
		}));

		if (submitted) {
			const isValueValid = typeof value === "string" ? value.trim() !== "" : value !== "" && value !== null;

			if (isValueValid) {
				setFieldErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[name];
					return newErrors;
				});
			}
		}
	}

	function validateForm(): boolean {
		const errors: Record<string, string> = {};
		const requiredFields: { key: keyof RealEstateFormData; label: string }[] = [
			{ key: "title", label: "Title" },
			{ key: "levelListing", label: "Listing Type" },
			{ key: "category", label: "Category" },
			{ key: "address", label: "Address" },
			{ key: "country", label: "Country" },
			{ key: "state", label: "State" },
			{ key: "city", label: "City" },
			{ key: "zipCode", label: "Zip Code" },
			{ key: "priceOption", label: "Price Option" },
			{ key: "currency", label: "Currency" },
			{ key: "propertySize", label: "Property Size" },
			{ key: "sizeUnit", label: "Size Unit" },
			{ key: "description", label: "Description" },
			{ key: "bedrooms", label: "Bedrooms" },
			{ key: "bathrooms", label: "Bathrooms" },
			{ key: "parkingNumber", label: "ParkingNumber" },
			{ key: "externalLink", label: "ExternalLink" },
		];

		requiredFields.forEach(({ key, label }) => {
			if (!formData[key] || formData[key].toString().trim() === "") {
				errors[key] = `${label} is required.`;
			}
		});

		if (formData.priceOption !== CONTACT_FOR_PRICE_ID && formData.price.trim() === "") {
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

		if (!validateForm()) {
			return;
		}
		const descriptionJSON = JSON.stringify({
			blocks: [{ type: "paragraph", data: { text: formData.description } }],
			version: "2.22.2",
		});

		const baseSlug = slugify(formData.title, { lower: true });
		const uniqueSlug = `${baseSlug}-${uuidv4()}`;

		console.log("formData", JSON.stringify(formData));

		const createProductVars = {
			name: formData.title,
			slug: uniqueSlug,
			productType: "UHJvZHVjdFR5cGU6NA==",
			category: formData.category,
			description: descriptionJSON,
			attributes: [
				{ id: "QXR0cmlidXRlOjI=", plainText: formData.address },
				{ id: "QXR0cmlidXRlOjEx", plainText: formData.city },
				{ id: "QXR0cmlidXRlOjE0", numeric: String(formData.zipCode) },
				{ id: "QXR0cmlidXRlOjE5", plainText: formData.externalLink },
				{ id: "QXR0cmlidXRlOjIy", plainText: formData.userId },
				{ id: "QXR0cmlidXRlOjI1", plainText: formData.description },
				{ id: "QXR0cmlidXRlOjQ1", plainText: formData.state },
				{ id: "QXR0cmlidXRlOjQw", plainText: formData.country },
				{ id: "QXR0cmlidXRlOjQx", plainText: formData.currency },
				{ id: "QXR0cmlidXRlOjQ3", plainText: formData.levelListing },
				{ id: "QXR0cmlidXRlOjI3", numeric: String(formData.bedrooms) },
				{ id: "QXR0cmlidXRlOjI4", numeric: String(formData.bathrooms) },
				{ id: "QXR0cmlidXRlOjQ4", dropdown: { id: formData.priceOption } },
				{ id: "QXR0cmlidXRlOjQ5", numeric: String(formData.parkingNumber) },
				{ id: "QXR0cmlidXRlOjUw", numeric: String(formData.propertySize) },
				{ id: "QXR0cmlidXRlOjUx", dropdown: { id: formData.sizeUnit } },
			],
		};

		// 1) Crear producto
		const createData = await executeGraphQL(CreateServiceProductDocument, {
			variables: createProductVars,
		});
		const productId = createData?.productCreate?.product?.id;
		if (!productId || createData.productCreate?.errors.length) {
			console.error(createData.productCreate?.errors);
			return;
		}

		const variantData = await executeGraphQL(CreateDefaultVariantDocument, {
			variables: { productId, sku: `${createProductVars.slug}-DEFAULT` },
		});
		const variantId = variantData?.productVariantCreate?.productVariant?.id;
		if (!variantId || variantData.productVariantCreate?.errors.length) {
			console.error(variantData.productVariantCreate?.errors);
			return;
		}

		await executeGraphQL(PublishProductInChannelDocument, {
			variables: { productId, channelId: "Q2hhbm5lbDox" },
		});
		await executeGraphQL(PublishVariantInChannelDocument, {
			variables: {
				variantId,
				channelId: "Q2hhbm5lbDox",
				price:
					formData.priceOption === "QXR0cmlidXRlVmFsdWU6MjIw" ? 0.0 : parseFloat(formData.price.toString()),
			},
		});
		await executeGraphQL(AddProductToCollectionDocument, {
			variables: { collectionId: "Q29sbGVjdGlvbjox", productId },
		});

		if (filesToUpload.length) {
			for (let i = 0; i < filesToUpload.length; i++) {
				await uploadGraphQL(AddServiceImageDocument, {
					product: productId,
					image: filesToUpload[i],
					alt: `${formData.title}-${i}`,
				});
			}
		}
		setShowSuccess(true);
		setTimeout(() => {
			setShowSuccess(false);
		}, 5000);
		setShowSuccess(true);

		console.log("Producto creado con ID:", productId);
	}

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			<div className={styles.imageUpload} style={{ marginBottom: "0.5rem" }}>
				<h3 className={styles.sectionTitle} style={{ marginBottom: "0.5rem" }}>
					Images <span style={{ color: "red" }}>*</span>
				</h3>
				<p className={styles.helperText}>At least one image is required</p>
				<div
					className={`${styles.imageUpload} ${filesToUpload.length ? styles.hasImages : ""} ${
						submitted && fieldErrors.images ? styles.errorBorder : ""
					}`}
				>
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
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className={styles.uploadButton}
						>
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
			</div>
			{submitted && fieldErrors.images && (
				<small
					className={styles.errorText}
					style={{ display: "block", marginTop: "0.25rem", marginBottom: "1rem", color: "red" }}
				>
					{fieldErrors.images}
				</small>
			)}

			<div className={styles.formGroup}>
				{fieldErrors.title && <small className={styles.errorText}>{fieldErrors.title}</small>}
				<input
					name="title"
					value={formData.title}
					onChange={handleChange}
					type="text"
					placeholder="Property title"
				/>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.levelListing && <small className={styles.errorText}>{fieldErrors.levelListing}</small>}

				<select name="levelListing" value={formData.levelListing} onChange={handleChange} defaultValue="">
					<option value="" disabled>
						Listing type
					</option>
					<option value="For Sale">For Sale</option>
					<option value="Short term rental">Short term rental</option>
					<option value="Long term rental (furnished)">Long term rental (furnished)</option>
					<option value="Long term rental (non-furnished)">Long term rental (non-furnished)</option>
				</select>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.category && <small className={styles.errorText}>{fieldErrors.category}</small>}

				<select
					name="category"
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

			<h3 className={styles.sectionTitle}>Location details</h3>

			<hr className={styles.fullWidthSeparator} />

			<div>
				<div className={styles.formGroup}>
					{fieldErrors.address && <small className={styles.errorText}>{fieldErrors.address}</small>}

					<div className="flex gap-2 py-2">
						<input
							type="text"
							name="address"
							className="py-4"
							placeholder="Address"
							onChange={handleChange}
						/>
					</div>
					<div className="flex gap-2 py-2">
						{fieldErrors.country && <small className={styles.errorText}>{fieldErrors.country}</small>}

						<select name="country" value={formData.country} onChange={handleCountryChange}>
							<option value="">Select Country</option>
							{countries.map((c) => (
								<option key={c.isoCode} value={c.isoCode}>
									{c.name}
								</option>
							))}
						</select>
					</div>
					<div className="flex gap-2 py-2">
						{fieldErrors.state && <small className={styles.errorText}>{fieldErrors.state}</small>}

						<select
							name="state"
							value={formData.state}
							onChange={handleStateChange}
							disabled={!states.length}
							className="gy-4"
						>
							<option value="">State</option>
							{states.map((s) => (
								<option key={s.isoCode} value={s.isoCode}>
									{s.name}
								</option>
							))}
						</select>
					</div>

					<div className="flex gap-2 py-2">
						{fieldErrors.city && <small className={styles.errorText}>{fieldErrors.city}</small>}

						<select name="city" onChange={handleCityChange} disabled={!cities.length}>
							<option value="">City</option>
							{cities.map((city) => (
								<option key={city.name} value={city.name}>
									{city.name}
								</option>
							))}
						</select>
						{fieldErrors.zipCode && <small className={styles.errorText}>{fieldErrors.zipCode}</small>}

						<input
							name="zipCode"
							type="text"
							inputMode="numeric"
							pattern="\d*"
							placeholder="Zip code"
							value={formData.zipCode}
							onChange={handleChange}
						/>
					</div>
				</div>
			</div>

			<h3 className={styles.sectionTitle}>Price details</h3>

			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formGroup}>
				{fieldErrors.priceOption && <small className={styles.errorText}>{fieldErrors.priceOption}</small>}

				<select id="price-options" name="priceOption" value={formData.priceOption} onChange={handleChange}>
					<option value="" disabled>
						Select an option
					</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjE2">For Sale</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjE3">Monthly</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjE4">Weekly</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjE5">Daily</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjIw">Contact for price</option>
				</select>
			</div>

			{formData.priceOption !== CONTACT_FOR_PRICE_ID && (
				<div className={styles.formGroup}>
					{fieldErrors.price && <small className={styles.errorText}>{fieldErrors.price}</small>}

					<input
						name="price"
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						placeholder="Price"
						value={formData.price}
						onChange={handleChange}
					/>
				</div>
			)}

			<div className={styles.formGroup}>
				{fieldErrors.currency && <small className={styles.errorText}>{fieldErrors.currency}</small>}

				<select name="currency" value={formData.currency} onChange={handleChange} defaultValue="">
					<option value="" disabled>
						Currency
					</option>
					<option value="USD">USD</option>
					<option value="EUR">EUR</option>
				</select>
			</div>

			<h3 className={styles.sectionTitle}>Property information</h3>

			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formGroup}>
				{fieldErrors.propertySize && <small className={styles.errorText}>{fieldErrors.propertySize}</small>}

				<input
					name="propertySize"
					type="text"
					inputMode="decimal"
					pattern="[0-9]*\.?[0-9]*"
					placeholder="Property size"
					value={formData.propertySize}
					onChange={handleChange}
				/>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.sizeUnit && <small className={styles.errorText}>{fieldErrors.sizeUnit}</small>}
				<select id="size-unit" name="sizeUnit" value={formData.sizeUnit} onChange={handleChange}>
					<option value="" disabled>
						Select a unit
					</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjIx">sqft</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjIy">sqm</option>
				</select>
			</div>
			{fieldErrors.bedrooms && <small className={styles.errorText}>{fieldErrors.bedrooms}</small>}
			<div className={styles.counterGroup}>
				<span>Number of bedrooms</span>
				<div className={styles.counterControls}>
					<button
						type="button"
						onClick={() => setFormData((prev) => ({ ...prev, bedrooms: Math.max(0, prev.bedrooms - 1) }))}
					>
						−
					</button>
					<span className={styles.counterValue}>{formData.bedrooms}</span>
					<button
						type="button"
						onClick={() => setFormData((prev) => ({ ...prev, bedrooms: prev.bedrooms + 1 }))}
					>
						+
					</button>
				</div>
			</div>
			{fieldErrors.parkingNumber && <small className={styles.errorText}>{fieldErrors.parkingNumber}</small>}
			<div className={styles.counterGroup}>
				<span>Number of parking</span>
				<div className={styles.counterControls}>
					<button
						type="button"
						onClick={() =>
							setFormData((prev) => ({
								...prev,
								parkingNumber: Math.max(0, Number(prev.parkingNumber) - 1),
							}))
						}
						className={styles.counterButton}
					>
						−
					</button>
					<span className={styles.counterValue}>{formData.parkingNumber}</span>
					<button
						type="button"
						onClick={() =>
							setFormData((prev) => ({
								...prev,
								parkingNumber: Number(prev.parkingNumber) + 1,
							}))
						}
						className={styles.counterButton}
					>
						+
					</button>
				</div>
			</div>
			{fieldErrors.bathrooms && <small className={styles.errorText}>{fieldErrors.bathrooms}</small>}
			<div className={styles.counterGroup}>
				<span>Number of bathrooms</span>
				<div className={styles.counterControls}>
					<button
						type="button"
						onClick={() => setFormData((prev) => ({ ...prev, bathrooms: Math.max(0, prev.bathrooms - 1) }))}
					>
						−
					</button>
					<span className={styles.counterValue}>{formData.bathrooms}</span>
					<button
						type="button"
						onClick={() => setFormData((prev) => ({ ...prev, bathrooms: prev.bathrooms + 1 }))}
					>
						+
					</button>
				</div>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.description && <small className={styles.errorText}>{fieldErrors.description}</small>}
				<textarea
					name="description"
					placeholder="Description"
					rows={4}
					value={formData.description}
					onChange={handleChange}
				/>
			</div>

			<h3 className={styles.sectionTitle}>External links</h3>
			<p className={styles.helperText}>
				You can share the link to other websites where your property is listed
			</p>
			<div className={styles.formGroup}>
				{fieldErrors.externalLink && <small className={styles.errorText}>{fieldErrors.externalLink}</small>}
				<input
					name="externalLink"
					type="url"
					placeholder="Https://"
					value={formData.externalLink}
					onChange={handleChange}
				/>
			</div>

			<button type="submit" className={styles.submitButton}>
				Publish listing
			</button>
			{showSuccess && (
				<div className={styles.successWrapper}>
					<Lottie
						animationData={SuccessAnimation}
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

"use client";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import { Country, State, City } from "country-state-city";
import slugify from "slugify";
import convert from "heic-convert/browser";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";
import styles from "./RealEstate.module.scss";
import { Loader } from "@/ui/atoms/Loader";
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
	const [countryCode, setCountryCode] = useState<string>("");
	const [stateCode, setStateCode] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
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
		const iso = e.target.value;
		setCountryCode(iso);
		const countryObj = countries.find((c) => c.isoCode === iso);
		const countryName = countryObj?.name || "";
		setFormData((prev) => ({
			...prev,
			country: countryName,
			state: "",
			city: "",
		}));
		const countryStates = State.getStatesOfCountry(iso) || [];
		setStates(countryStates);
		setCities([]);
	}

	function handleStateChange(e: ChangeEvent<HTMLSelectElement>) {
		const iso = e.target.value;
		setStateCode(iso);
		const stateObj = states.find((s) => s.isoCode === iso);
		const stateName = stateObj?.name || "";
		setFormData((prev) => ({
			...prev,
			state: stateName,
			city: "",
		}));
		const stateCities = City.getCitiesOfState(countryCode, iso) || [];
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

		setIsLoading(true);

		try {
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

			function detectImageFormat(uint8Array: Uint8Array): string {
				if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8 && uint8Array[2] === 0xff) {
					return "jpeg";
				}

				if (
					uint8Array[0] === 0x89 &&
					uint8Array[1] === 0x50 &&
					uint8Array[2] === 0x4e &&
					uint8Array[3] === 0x47
				) {
					return "png";
				}

				if (uint8Array.length > 12) {
					const ftypCheck =
						uint8Array[4] === 0x66 &&
						uint8Array[5] === 0x74 &&
						uint8Array[6] === 0x79 &&
						uint8Array[7] === 0x70;

					if (ftypCheck) {
						const brand = String.fromCharCode(uint8Array[8], uint8Array[9], uint8Array[10], uint8Array[11]);
						if (brand === "heic" || brand === "heix" || brand === "heis" || brand === "hevs") {
							return "heic";
						}
					}
				}

				if (
					uint8Array.length > 12 &&
					uint8Array[0] === 0x52 &&
					uint8Array[1] === 0x49 &&
					uint8Array[2] === 0x46 &&
					uint8Array[3] === 0x46 &&
					uint8Array[8] === 0x57 &&
					uint8Array[9] === 0x45 &&
					uint8Array[10] === 0x42 &&
					uint8Array[11] === 0x50
				) {
					return "webp";
				}

				return "unknown";
			}

			if (filesToUpload.length) {
				console.log(`🖼️  Iniciando subida de ${filesToUpload.length} archivos...`);
				for (let i = 0; i < filesToUpload.length; i++) {
					let fileToSend = filesToUpload[i];
					console.log(`\n📁 Archivo ${i + 1}: ${fileToSend.name}`);

					if (/\.heic$/i.test(fileToSend.name)) {
						console.log(`🔄  Verificando formato de ${fileToSend.name}...`);
						const arrayBuffer = await fileToSend.arrayBuffer();
						console.log(`📦  Leído como ArrayBuffer (${arrayBuffer.byteLength} bytes)`);
						const uint8ArrayInput = new Uint8Array(arrayBuffer);

						const actualFormat = detectImageFormat(uint8ArrayInput);
						console.log(`🔍  Formato detectado: ${actualFormat}`);

						if (actualFormat === "heic") {
							console.log(`🔄  Convirtiendo ${fileToSend.name} de HEIC a JPEG...`);

							try {
								const outputBuffer: ArrayBuffer = await convert({
									buffer: uint8ArrayInput.buffer,
									format: "JPEG",
									quality: 0.8,
								});
								console.log(`✅  Conversión completa (${outputBuffer.byteLength} bytes)`);
								const blob = new Blob([outputBuffer], { type: "image/jpeg" });
								fileToSend = new File([blob], fileToSend.name.replace(/\.heic$/i, ".jpg"), {
									type: "image/jpeg",
								});
								console.log(`🆕  Nuevo File: ${fileToSend.name}, type=${fileToSend.type}`);
							} catch (conversionError) {
								console.error("Error durante la conversión HEIC:", conversionError);
								throw conversionError;
							}
						} else if (actualFormat === "jpeg") {
							console.log(`📝  Archivo es JPEG con extensión .heic, renombrando...`);
							const blob = new Blob([uint8ArrayInput], { type: "image/jpeg" });
							fileToSend = new File([blob], fileToSend.name.replace(/\.heic$/i, ".jpg"), {
								type: "image/jpeg",
							});
							console.log(`🆕  Archivo renombrado: ${fileToSend.name}, type=${fileToSend.type}`);
						} else {
							console.warn(`⚠️  Formato no reconocido (${actualFormat}) para ${fileToSend.name}`);
						}
					} else {
						console.log(`✔️  No necesita conversión: ${fileToSend.name}`);
					}

					console.log(`🚀  Subiendo ${fileToSend.name}...`);
					await uploadGraphQL(AddServiceImageDocument, {
						product: productId,
						image: fileToSend,
						alt: `${formData.title}-${i}`,
					});
					console.log(`🎉  Subida completada para ${fileToSend.name}`);
				}
				console.log("🏁  Todas las imágenes procesadas y subidas.");
			}
			setShowSuccess(true);
			setTimeout(() => {
				setShowSuccess(false);
			}, 5000);
			setShowSuccess(true);

			console.log("Producto creado con ID:", productId);
		} catch (error) {
			console.error("Error al crear el producto:", error);
		} finally {
			setIsLoading(false);
			setSubmitted(false);
			setFilesToUpload([]);
			setFormData({
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
			setFieldErrors({});
		}
	}

	useEffect(() => {
		switch (formData.levelListing) {
			case "For Sale":
				setFormData((prev) => ({ ...prev, priceOption: "QXR0cmlidXRlVmFsdWU6MjE2" }));
				break;
			case "Short term rental":
				setFormData((prev) => ({ ...prev, priceOption: "QXR0cmlidXRlVmFsdWU6MjE5" }));
				break;
			case "Long term rental (furnished)":
			case "Long term rental (non-furnished)":
				setFormData((prev) => ({ ...prev, priceOption: "QXR0cmlidXRlVmFsdWU6MjE3" }));
				break;
			default:
				break;
		}
	}, [formData.levelListing]);

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			{isLoading && (
				<div className={styles.loadingOverlay}>
					{" "}
					<Loader />
				</div>
			)}
			<div className={styles.imageUpload} style={{ marginBottom: "0.5rem" }}>
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
						<select name="country" value={countryCode} onChange={handleCountryChange}>
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
						<select name="state" value={stateCode} onChange={handleStateChange} disabled={!states.length}>
							<option value="">Select State</option>
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
					<option value="QXR0cmlidXRlVmFsdWU6MjE2" disabled={formData.levelListing !== "For Sale"}>
						For Sale
					</option>
					<option
						value="QXR0cmlidXRlVmFsdWU6MjE7"
						disabled={!formData.levelListing.startsWith("Long term rental")}
					>
						Monthly
					</option>
					<option value="QXR0cmlidXRlVmFsdWU6MjE5" disabled={formData.levelListing !== "Short term rental"}>
						Daily
					</option>
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

			<button className={styles.submitButton} type="submit" disabled={submitted}>
				{submitted ? <Loader /> : "Next"}
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

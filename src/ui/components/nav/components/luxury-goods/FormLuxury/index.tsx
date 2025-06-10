"use client";
import React, { useState, useRef, type ChangeEvent, useEffect } from "react";
import slugify from "slugify";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { Country, State, City } from "country-state-city";
import convert from "heic-convert/browser";
import { useRouter, usePathname } from "next/navigation";
import styles from "./LuxuryGoodsForm.module.scss";
import { useUser } from "@/UserKimani/context/UserContext";
import { Loader } from "@/ui/atoms/Loader";
import {
	CategoryTreeDocument,
	CreateServiceProductDocument,
	CreateDefaultVariantDocument,
	PublishProductInChannelDocument,
	PublishVariantInChannelDocument,
	AddProductToCollectionDocument,
	AddServiceImageDocument,
	DeleteServiceImageDocument,
	UpdateServiceProductDocument,
	ProductDetailsBySlugDocument,
	type ProductDetailsBySlugQuery,
	type ProductDetailsBySlugQueryVariables,
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

export interface RealEstateFormProps {
	productSlug?: string;
}

interface FormState {
	title: string;
	category: string;
	city: string;
	zip: string;
	area: string;
	state: string;
	address: string;
	country: string;
	priceOption: string;
	email: string;
	price: string;
	currency: string;
	condition: string;
	description: string;
	externalLink: string;
	brandName: string;
}

export function LuxuryGoodsForm({ productSlug }: RealEstateFormProps) {
	const [form, setForm] = useState<FormState>({
		title: "",
		category: "",
		city: "",
		zip: "",
		area: "",
		state: "",
		country: "",
		address: "",
		priceOption: "",
		email: "",
		price: "",
		currency: "",
		condition: "",
		description: "",
		externalLink: "",
		brandName: "",
	});
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const [errors, setErrors] = useState<{ imageError?: string }>({});
	const { user } = useUser();
	const [successMessage, setSuccessMessage] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [countryCode, setCountryCode] = useState<string>("");
	const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
	const [existingProductId, setExistingProductId] = useState<string>("");
	const initialExistingImages = useRef<{ id: string; url: string }[]>([]);
	const [stateCode, setStateCode] = useState<string>("");
	const [countries] = useState(Country.getAllCountries());
	const pathname = usePathname();
	const router = useRouter();
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

	useEffect(() => {
		if (!productSlug) return;

		executeGraphQL<ProductDetailsBySlugQuery, ProductDetailsBySlugQueryVariables>(
			ProductDetailsBySlugDocument,
			{ variables: { slug: productSlug, channel: "default-channel" } },
		)
			.then((data) => {
				const p = data.product;
				if (!p) return;

				let descText = "";
				if (typeof p.description === "string") {
					try {
						const parsed = JSON.parse(p.description) as {
							blocks: Array<{ data: { text: string } }>;
						};
						descText = parsed.blocks?.[0]?.data.text ?? "";
					} catch {}
				}

				const getValue = (slug: string) =>
					p.attributes.find((a) => a.attribute.slug === slug)?.values?.[0]?.name ?? "";

				const getSelectedValueId = (slug: string) =>
					p.attributes.find((a) => a.attribute.slug === slug)?.values?.[0]?.id ?? "";

				const countryName = getValue("country");
				const isoCountry = Country.getAllCountries().find((c) => c.name === countryName)?.isoCode;

				const allStates = isoCountry ? State.getStatesOfCountry(isoCountry) : [];
				const stateName = getValue("state");
				const derivedStateCode = allStates.find((s) => s.name === stateName)?.isoCode;
				const citiesForState =
					isoCountry && derivedStateCode ? City.getCitiesOfState(isoCountry, derivedStateCode) : [];

				const currentCity = getValue("city");
				const cityOptions = [...citiesForState];
				if (currentCity && !cityOptions.find((c) => c.name === currentCity)) {
					cityOptions.unshift({
						name: currentCity,
						countryCode: isoCountry!,
						stateCode: derivedStateCode!,
					});
				}

				setCountryCode(isoCountry ?? "");
				setStates(allStates);
				setStateCode(derivedStateCode ?? "");
				setCities(cityOptions);

				setForm({
					title: p.name,
					category: p.category?.id ?? "",
					city: currentCity,
					zip: getValue("zip-code"),
					area: getValue("property-size"),
					state: stateName,
					country: countryName,
					address: getValue("address"),
					priceOption: getSelectedValueId("price-options"),
					email: getValue("email"),
					price: p.pricing?.priceRange?.start?.gross.amount.toString() ?? "",
					currency: getValue("currency"),
					condition: getValue("condition"),
					description: descText,
					externalLink: getValue("external-link"),
					brandName: getValue("brand-name"),
				});

				setExistingProductId(p.id);

				setSelectedCategory(p.category?.id ?? "");

				const imgs = p.media?.map((m) => ({ id: m.id, url: m.url })) ?? [];
				setExistingImages(imgs);
				initialExistingImages.current = imgs;
			})
			.catch(console.error);
	}, [productSlug]);

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
			if (parts.length > 2) filtered = parts.shift() + "." + parts.join("");
			const [intPart, decPart] = filtered.split(".");
			filtered = decPart !== undefined ? intPart + "." + decPart.slice(0, 2) : intPart;

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
		const iso = e.target.value;
		setCountryCode(iso);
		const countryObj = countries.find((c) => c.isoCode === iso);
		const countryName = countryObj?.name || "";
		setForm((prev) => ({
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
		setForm((prev) => ({
			...prev,
			state: stateName,
			city: "",
		}));
		const stateCities = City.getCitiesOfState(countryCode, iso) || [];
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
			address: "",
			priceOption: "",
			price: "",
			currency: "",
			condition: "",
			description: "",
			externalLink: "",
			brandName: "",
			email: "",
		});
		setFilesToUpload([]);
		setStates([]);
		setCities([]);
		setErrors({});
	}

	async function handleSubmit(e: React.FormEvent) {
		if (productSlug) {
			e.preventDefault();

			setIsLoading(true);

			try {
				const descriptionJSON = JSON.stringify({
					blocks: [{ type: "paragraph", data: { text: form.description } }],
					version: "2.22.2",
				});

				const attributes = [
					{ id: "QXR0cmlidXRlOjEx", plainText: form.city },
					{ id: "QXR0cmlidXRlOjQw", plainText: form.country },
					{ id: "QXR0cmlidXRlOjQ1", plainText: form.state },
					{ id: "QXR0cmlidXRlOjE0", numeric: form.zip },
					{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
					{ id: "QXR0cmlidXRlOjQx", plainText: form.currency },
					{ id: "QXR0cmlidXRlOjQ2", plainText: form.condition },
					{ id: "QXR0cmlidXRlOjI1", plainText: form.description },
					{ id: "QXR0cmlidXRlOjIx", plainText: form.brandName },
					{ id: "QXR0cmlidXRlOjI=", plainText: form.address },
					{ id: "QXR0cmlidXRlOjU=", plainText: form.email },
					{ id: "QXR0cmlidXRlOjE5", plainText: form.externalLink || "" },
				];

				const toDelete = initialExistingImages.current
					.map((img) => img.id)
					.filter((id) => !existingImages.some((img) => img.id === id));

				for (const imageId of toDelete) {
					await executeGraphQL(DeleteServiceImageDocument, { variables: { id: imageId } });
				}

				const result = await executeGraphQL(UpdateServiceProductDocument, {
					variables: {
						id: existingProductId,
						name: form.title,
						slug: slugify(form.title, { lower: true }),
						description: descriptionJSON,
						attributes,
					},
				});

				const productId = result.productUpdate?.product?.id;
				if (!productId || result.productUpdate?.errors?.length) {
					console.error(result.productUpdate?.errors);
					return;
				}

				for (let i = 0; i < filesToUpload.length; i++) {
					const fileToSend = filesToUpload[i];
					await uploadGraphQL(AddServiceImageDocument, {
						product: productId,
						image: fileToSend,
						alt: `${form.title}-${i}`,
					});
				}

				successMessage;
				setTimeout(() => successMessage, 5000);

				console.log("Producto actualizado con ID:", productId);
			} catch (error) {
				console.error("Error actualizando producto:", error);
			} finally {
				setIsLoading(false);
				setFilesToUpload([]);
				const segments = pathname.split("/").filter(Boolean);
				const parentLevels = 2;
				const base = "/" + segments.slice(0, -parentLevels).join("/");
				router.push(base || "/");
			}
			return;
		} else {
			e.preventDefault();
			setSuccessMessage("");

			setIsLoading(true);

			try {
				if (filesToUpload.length === 0) {
					setErrors((prev) => ({ ...prev, imageError: "At least one image is required" }));
					window.scrollTo({ top: 0, behavior: "smooth" });
					return;
				}

				setErrors((prev) => ({ ...prev, imageError: undefined }));

				const baseSlug = slugify(form.title, { lower: true });
				const uniqueSlug = `${baseSlug}-${uuidv4()}`;

				const descriptionJSON = JSON.stringify({
					blocks: [{ type: "paragraph", data: { text: form.description } }],
					version: "2.0",
				});

				const createVars = {
					name: form.title,
					slug: uniqueSlug,
					productType: "UHJvZHVjdFR5cGU6Mw==",
					category: form.category,
					description: descriptionJSON,
					attributes: [
						{ id: "QXR0cmlidXRlOjEx", plainText: form.city },
						{ id: "QXR0cmlidXRlOjQw", plainText: form.country },
						{ id: "QXR0cmlidXRlOjQ1", plainText: form.state },
						{ id: "QXR0cmlidXRlOjE0", numeric: form.zip },
						{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
						{ id: "QXR0cmlidXRlOjQx", plainText: form.currency },
						{ id: "QXR0cmlidXRlOjQ2", plainText: form.condition },
						{ id: "QXR0cmlidXRlOjI1", plainText: form.description },
						{ id: "QXR0cmlidXRlOjIx", plainText: form.brandName },
						{ id: "QXR0cmlidXRlOjI=", plainText: form.address },
						{ id: "QXR0cmlidXRlOjU=", plainText: form.email },
						{ id: "QXR0cmlidXRlOjE5", plainText: form.externalLink || "" },
					],
					userId: user?._id || "",
					userData: JSON.stringify(user),
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
							alt: `${form.title}-${i}`,
						});
						console.log(`🎉  Subida completada para ${fileToSend.name}`);
					}
					console.log("🏁  Todas las imágenes procesadas y subidas.");
				}

				setSuccessMessage("Form submitted successfully!");
				clearForm();
				window.scrollTo({ top: 0, behavior: "smooth" });
			} catch (error) {
				console.error("Error submitting form:", error);
				setErrors((prev) => ({ ...prev, imageError: "An error occurred while submitting the form." }));
				window.scrollTo({ top: 0, behavior: "smooth" });
			} finally {
				setFilesToUpload([]);
				setIsLoading(false);
				setForm({
					title: "",
					category: "",
					city: "",
					zip: "",
					area: "",
					state: "",
					country: "",
					address: "",
					priceOption: "",
					email: "",
					price: "",
					currency: "",
					condition: "",
					description: "",
					externalLink: "",
					brandName: "",
				});
				const parent = pathname.split("/").slice(0, -1).join("/") || "/";
				router.push(parent);
			}
		}
	}

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			{isLoading && (
				<div className={styles.loadingOverlay}>
					{" "}
					<Loader />
				</div>
			)}
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

			<div className={styles.imageUpload} style={{ marginBottom: "0.5rem" }}>
				{existingImages.map((img) => (
					<div key={img.id} className={styles.thumbWrapper}>
						<button
							type="button"
							className={styles.deleteButton}
							onClick={() => setExistingImages((prev) => prev.filter((i) => i.id !== img.id))}
						>
							×
						</button>
						<Image src={img.url} alt="" width={100} height={100} className={styles.thumbnail} />
					</div>
				))}

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
							value={form.address}
							className={styles.locationInput}
						/>
						<select name="country" value={countryCode} onChange={handleCountryChange}>
							<option value="">Select Country</option>
							{countries.map((c) => (
								<option key={c.isoCode} value={c.isoCode}>
									{c.name}
								</option>
							))}
						</select>
						<select name="state" value={stateCode} onChange={handleStateChange} disabled={!states.length}>
							<option value="">Select State</option>
							{states.map((s) => (
								<option key={s.isoCode} value={s.isoCode}>
									{s.name}
								</option>
							))}
						</select>

						<div className={styles.cityZipRow}>
							<select
								name="city"
								value={form.city}
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

			<h3 className={styles.sectionTitle}>Contact information</h3>
			<div className={styles.formGroup}>
				<input name="email" value={form.email} onChange={handleChange} type="text" placeholder="Email" />
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

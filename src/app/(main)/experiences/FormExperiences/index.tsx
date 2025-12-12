"use client";

import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import slugify from "slugify";
import convert from "heic-convert/browser";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";
import styles from "./experiences.module.scss";
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
import { SuccessAnimation } from "@/ui/components/nav/components/animation";

export interface ExperienceFormData {
	title: string;
	category: string; // Solo para la categoría, no atributo
	description: string; // Campo description del producto, NO atributo
	email: string; // Atributo Email
	phone: string; // Atributo Phone Number
	price: string; // Para la variante, NO atributo
	priceOption: string;
}

export interface ExperienceFormProps {
	productSlug?: string;
}

export function ExperienceForm({ productSlug }: ExperienceFormProps) {
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { user } = useUser();
	const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
	const [existingProductId, setExistingProductId] = useState<string>("");
	const initialExistingImages = useRef<{ id: string; url: string }[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	const _CONTACT_FOR_PRICE_ID = "contact_for_price"; // Solo para lógica interna

	const [categories, setCategories] = useState<
		{
			id: string;
			name: string;
			slug: string;
			grandchildren: { id: string; name: string; slug: string }[];
		}[]
	>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("");

	const [formData, setFormData] = useState<ExperienceFormData>({
		title: "",
		category: "",
		description: "",
		email: "",
		phone: "",
		price: "",
		priceOption: "fixed", // "fixed" o "contact"
	});
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	// Reemplaza todo el useEffect por:
	useEffect(() => {
		// ID fijo de la categoría "Experiences" según tus datos
		const EXPERIENCES_CATEGORY_ID = "Q2F0ZWdvcnk6MjYz";

		// Crear array con solo la categoría Experiences
		setCategories([
			{
				id: EXPERIENCES_CATEGORY_ID,
				name: "Experiences",
				slug: "experiences",
				grandchildren: [],
			},
		]);

		// Seleccionar automáticamente
		setSelectedCategory(EXPERIENCES_CATEGORY_ID);
		setFormData((prev) => ({ ...prev, category: EXPERIENCES_CATEGORY_ID }));

		// También puedes hacer la consulta para verificar, pero usar este fallback
		executeGraphQL<CategoryTreeQuery, { slug: string }>(CategoryTreeDocument, {
			variables: { slug: "experiences" },
		})
			.then((data) => {
				if (data.category) {
					// Actualizar con datos reales si existen
					setCategories((prev) =>
						prev.map((cat) =>
							cat.id === EXPERIENCES_CATEGORY_ID ? { ...cat, name: data.category!.name } : cat,
						),
					);
				}
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

				// Parsear descripción de EditorJS
				let descText = "";
				if (typeof p.description === "string") {
					try {
						const parsed = JSON.parse(p.description) as {
							blocks: Array<{ data: { text: string } }>;
						};
						descText = parsed.blocks?.[0]?.data.text ?? "";
					} catch {}
				}

				// Obtener atributos específicos de Experiences
				const getValue = (slug: string) =>
					p.attributes.find((a) => a.attribute.slug === slug)?.values?.[0]?.name ?? "";

				setFormData({
					title: p.name,
					category: p.category?.id ?? "",
					description: descText,
					email: getValue("email"),
					phone: getValue("phone-number"),
					price: p.pricing?.priceRange?.start?.gross.amount.toString() ?? "",
					priceOption: p.pricing?.priceRange?.start?.gross.amount === 0 ? "contact" : "fixed",
				});

				setExistingProductId(p.id);
				setSelectedCategory(p.category?.id ?? "");

				const imgs = p.media?.map((m) => ({ id: m.id, url: m.url })) ?? [];
				setExistingImages(imgs);
				initialExistingImages.current = imgs;
			})
			.catch(console.error);
	}, [productSlug]);

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
		if (formData.priceOption === "contact") {
			setFormData((prev) => ({ ...prev, price: "0.0" }));
		}
	}, [formData.priceOption]);

	function handleRemove(idxToRemove: number) {
		setFilesToUpload((prev) => prev.filter((_, i) => i !== idxToRemove));
	}

	function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
		setSelectedCategory(e.target.value);
	}

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
		const { name, value, type } = e.target;
		setFieldErrors((prev) => ({ ...prev, [name]: "" }));

		if (name === "priceOption") {
			if (value === "contact") {
				setFormData((prev) => ({ ...prev, priceOption: value, price: "0.0" }));
			} else {
				setFormData((prev) => ({ ...prev, priceOption: value, price: "" }));
			}
			return;
		}

		if (name === "price") {
			let filtered = value.replace(/[^0-9.]/g, "");
			const parts = filtered.split(".");
			if (parts.length > 2) filtered = parts.shift() + "." + parts.join("");
			const [intPart, decPart] = filtered.split(".");
			filtered = decPart !== undefined ? intPart + "." + decPart.slice(0, 2) : intPart;

			setFormData((prev) => ({ ...prev, price: filtered }));
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
		const requiredFields: { key: keyof ExperienceFormData; label: string }[] = [
			{ key: "title", label: "Title" },
			{ key: "category", label: "Category" },
			{ key: "description", label: "Description" },
			{ key: "email", label: "Email" },
			{ key: "phone", label: "Phone" },
		];

		requiredFields.forEach(({ key, label }) => {
			if (!formData[key] || formData[key].toString().trim() === "") {
				errors[key] = `${label} is required.`;
			}
		});

		if (formData.priceOption !== "contact" && formData.price.trim() === "") {
			errors["price"] = "Price is required.";
		}

		if (productSlug) {
			if (existingImages.length === 0 && filesToUpload.length === 0) {
				errors["images"] = "At least one image is required";
			}
		} else {
			if (filesToUpload.length === 0) {
				errors["images"] = "At least one image is required.";
			}
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitted(true);

		if (!validateForm()) {
			setSubmitted(false);
			return;
		}

		setIsLoading(true);

		try {
			const descriptionJSON = JSON.stringify({
				blocks: [{ type: "paragraph", data: { text: formData.description } }],
				version: "2.22.2",
			});

			// SOLO los 3 atributos válidos para Experiences
			const attributes = [
				{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" }, // User ID
				{ id: "QXR0cmlidXRlOjY=", plainText: formData.phone }, // Phone Number
				{ id: "QXR0cmlidXRlOjU=", plainText: formData.email }, // Email
			];

			if (productSlug) {
				// UPDATE MODE
				const toDelete = initialExistingImages.current
					.map((img) => img.id)
					.filter((id) => !existingImages.some((img) => img.id === id));

				for (const imageId of toDelete) {
					await executeGraphQL(DeleteServiceImageDocument, { variables: { id: imageId } });
				}

				const result = await executeGraphQL(UpdateServiceProductDocument, {
					variables: {
						id: existingProductId,
						name: formData.title,
						slug: slugify(formData.title, { lower: true }),
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
						alt: `${formData.title}-${i}`,
					});
				}

				console.log("Experience updated with ID:", productId);
			} else {
				// CREATE MODE - Usar el tipo de producto CORRECTO para Experiences
				const baseSlug = slugify(formData.title, { lower: true });
				const uniqueSlug = `${baseSlug}-${uuidv4()}`;

				const createProductVars = {
					name: formData.title,
					slug: uniqueSlug,
					productType: "UHJvZHVjdFR5cGU6Mzg=", // CORREGIDO: Tipo de producto Experiences
					category: formData.category,
					description: descriptionJSON,
					attributes,
					userId: user?._id || "",
					userData: JSON.stringify(user),
				};

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

				const variantPrice = formData.priceOption === "contact" ? 0.0 : parseFloat(formData.price);
				await executeGraphQL(PublishVariantInChannelDocument, {
					variables: {
						variantId,
						channelId: "Q2hhbm5lbDox",
						price: variantPrice,
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
					return "unknown";
				}

				if (filesToUpload.length) {
					for (let i = 0; i < filesToUpload.length; i++) {
						let fileToSend = filesToUpload[i];

						if (/\.heic$/i.test(fileToSend.name)) {
							const arrayBuffer = await fileToSend.arrayBuffer();
							const uint8ArrayInput = new Uint8Array(arrayBuffer);
							const actualFormat = detectImageFormat(uint8ArrayInput);

							if (actualFormat === "heic") {
								try {
									const outputBuffer: ArrayBuffer = await convert({
										buffer: uint8ArrayInput.buffer,
										format: "JPEG",
										quality: 0.8,
									});
									const blob = new Blob([outputBuffer], { type: "image/jpeg" });
									fileToSend = new File([blob], fileToSend.name.replace(/\.heic$/i, ".jpg"), {
										type: "image/jpeg",
									});
								} catch (conversionError) {
									console.error("Error converting HEIC:", conversionError);
									throw conversionError;
								}
							} else if (actualFormat === "jpeg") {
								const blob = new Blob([uint8ArrayInput], { type: "image/jpeg" });
								fileToSend = new File([blob], fileToSend.name.replace(/\.heic$/i, ".jpg"), {
									type: "image/jpeg",
								});
							}
						}

						await uploadGraphQL(AddServiceImageDocument, {
							product: productId,
							image: fileToSend,
							alt: `${formData.title}-${i}`,
						});
					}
				}

				console.log("Experience created with ID:", productId);
			}

			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 5000);
		} catch (error) {
			console.error("Error saving experience:", error);
		} finally {
			setIsLoading(false);
			setSubmitted(false);
			setFilesToUpload([]);

			if (!productSlug) {
				setFormData({
					title: "",
					category: "",
					description: "",
					email: "",
					phone: "",
					price: "",
					priceOption: "fixed",
				});
				setFieldErrors({});
			}

			const segments = pathname.split("/").filter(Boolean);
			const parentLevels = productSlug ? 2 : 1;
			const base = "/" + segments.slice(0, -parentLevels).join("/");
			router.push(base || "/");
		}
	}

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			{isLoading && (
				<div className={styles.loadingOverlay}>
					<Loader />
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

			{fieldErrors.images && (
				<small
					className={styles.errorText}
					style={{
						display: "block",
						marginTop: "0.25rem",
						marginBottom: "1rem",
						color: "red",
						paddingTop: "0.25rem",
					}}
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
					placeholder="Experience title"
				/>
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

			<h3 className={styles.sectionTitle}>Price details</h3>
			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formGroup}>
				<select name="priceOption" value={formData.priceOption} onChange={handleChange}>
					<option value="fixed">Fixed price</option>
					<option value="contact">Contact for price</option>
				</select>
			</div>

			{formData.priceOption !== "contact" && (
				<div className={styles.formGroup}>
					{fieldErrors.price && <small className={styles.errorText}>{fieldErrors.price}</small>}
					<input
						name="price"
						type="text"
						inputMode="decimal"
						pattern="[0-9]*\.?[0-9]*"
						placeholder="Price"
						value={formData.price}
						onChange={handleChange}
					/>
				</div>
			)}

			<h3 className={styles.sectionTitle}>Contact information</h3>
			<hr className={styles.fullWidthSeparator} />

			<div className={styles.formGroup}>
				{fieldErrors.email && <small className={styles.errorText}>{fieldErrors.email}</small>}
				<input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="Email" />
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.phone && <small className={styles.errorText}>{fieldErrors.phone}</small>}
				<input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="Phone" />
			</div>

			<button className={styles.submitButton} type="submit" disabled={submitted}>
				{submitted ? <Loader /> : "Create Experience"}
			</button>

			{showSuccess && (
				<div className={styles.successWrapper}>
					<Lottie
						animationData={SuccessAnimation}
						loop={false}
						autoplay
						style={{ height: 200, width: 200 }}
					/>
					<p>Experience added successfully!</p>
				</div>
			)}
		</form>
	);
}

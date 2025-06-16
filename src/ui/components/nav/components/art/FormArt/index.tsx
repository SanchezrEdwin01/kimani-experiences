"use client";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import slugify from "slugify";
import Lottie from "lottie-react";
import convert from "heic-convert/browser";
import { v4 as uuidv4 } from "uuid";
import styles from "./ArtworkForm.module.scss";
import { useUser } from "@/UserKimani/context/UserContext";
import { Loader } from "@/ui/atoms/Loader";
import { executeGraphQL, uploadGraphQL } from "@/lib/graphql";
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
import { SuccessAnimation } from "@/ui/components/nav/components/animation";

interface ArtFormData {
	title: string;
	artisName: string;
	artCategory: string;
	price: string;
	currency: string;
	artType: string;
	dimensions: string;
	unit: string;
	printType: string;
	email: string;
	numberOfPrints: string;
	datePainted: string;
	frame: string;
	collection: string;
	signature: boolean;
	description: string;
	externalLink: string;
	certificateFile?: File;
}

export interface RealEstateFormProps {
	productSlug?: string;
}

export function ArtForm({ productSlug }: RealEstateFormProps) {
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isLoading, setIsLoading] = useState(false);
	const pathname = usePathname();
	const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
	const [existingProductId, setExistingProductId] = useState<string>("");
	const initialExistingImages = useRef<{ id: string; url: string }[]>([]);
	const router = useRouter();
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
		artisName: "",
		artCategory: "",
		price: "",
		currency: "",
		artType: "",
		dimensions: "",
		unit: "",
		printType: "",
		numberOfPrints: "",
		email: "",
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
	const { user } = useUser();
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
		if (name === "price") {
			let filtered = value.replace(/[^0-9.]/g, "");
			const parts = filtered.split(".");
			if (parts.length > 2) filtered = parts.shift() + "." + parts.join("");
			const [intPart, decPart] = filtered.split(".");
			filtered = decPart !== undefined ? intPart + "." + decPart.slice(0, 2) : intPart;

			setForm((prev) => ({ ...prev, price: filtered }));
			return;
		}
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
					} catch {
						descText = "";
					}
				}

				const getValue = (slug: string): string =>
					p.attributes.find((a) => a.attribute.slug === slug)?.values?.[0]?.name ?? "";

				setForm({
					title: p.name,
					artisName: getValue("painter-name"),
					artCategory: p.category?.id ?? "",
					price: p.pricing?.priceRange?.start?.gross.amount.toString() ?? "",
					currency: getValue("currency"),
					artType: getValue("art-type"),
					dimensions: getValue("dimensions"),
					unit: getValue("size-unit"),
					printType: getValue("print-type"),
					email: getValue("email"),
					numberOfPrints: getValue("number-of-prints"),
					datePainted: getValue("date-painted"),
					frame: getValue("frame"),
					collection: getValue("collection"),
					signature: false,
					description: descText,
					externalLink: getValue("link-to-artwork"),
					certificateFile: undefined,
				});

				setExistingProductId(p.id);
				setSelectedCategory(p.category?.id ?? "");

				const imgs = p.media?.map((m) => ({ id: m.id, url: m.url })) ?? [];
				setExistingImages(imgs);
				initialExistingImages.current = imgs;
			})
			.catch(console.error);
	}, [productSlug]);

	function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
		setSelectedCategory(e.target.value);
		setForm((prev) => ({ ...prev, artCategory: e.target.value }));
	}

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
				uint8Array[4] === 0x66 && uint8Array[5] === 0x74 && uint8Array[6] === 0x79 && uint8Array[7] === 0x70;

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

	function validateForm(): boolean {
		const errors: Record<string, string> = {};
		const requiredFields: { key: keyof ArtFormData; label: string }[] = [
			{ key: "title", label: "Title" },
			{ key: "artisName", label: "Artist Name" },
			{ key: "artCategory", label: "Category" },
			{ key: "price", label: "Price" },
			{ key: "currency", label: "Currency" },
			{ key: "description", label: "Description" },
			{ key: "email", label: "Email" },
		];

		requiredFields.forEach(({ key, label }) => {
			const value = form[key];
			if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
				errors[key] = `${label} is required.`;
			}
		});

		if (form.price && form.price.trim() === "") {
			errors["price"] = "Price is required.";
		}

		if (form.dimensions.trim() !== "" && (!form.unit || form.unit.trim() === "")) {
			errors.unit = "Unit is required when dimensions are provided.";
		}

		if (productSlug) {
			if (existingImages.length === 0 && filesToUpload.length === 0) {
				errors["images"] = "At least one image is required when no existing images";
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
		if (productSlug) {
			e.preventDefault();
			setSubmitted(true);
			if (!validateForm()) {
				setIsLoading(false);
				setSubmitted(false);
				return;
			}
			setIsLoading(true);

			try {
				const descriptionJSON = JSON.stringify({
					blocks: [{ type: "paragraph", data: { text: form.description } }],
					version: "2.22.2",
				});

				const attributes = [
					// { id: "QXR0cmlidXRlOjk=", boolean: form.signature },
					{ id: "QXR0cmlidXRlOjU=", plainText: form.email },
					...(form.dimensions ? [{ id: "QXR0cmlidXRlOjUx", plainText: form.unit }] : []),
					{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
					{ id: "QXR0cmlidXRlOjMw", plainText: form.artisName },
					{ id: "QXR0cmlidXRlOjMy", plainText: form.dimensions },
					...(form.numberOfPrints ? [{ id: "QXR0cmlidXRlOjM0", numeric: form.numberOfPrints }] : []),
					{ id: "QXR0cmlidXRlOjM1", plainText: form.datePainted },
					{ id: "QXR0cmlidXRlOjM3", plainText: form.collection },
					{ id: "QXR0cmlidXRlOjM4", plainText: form.externalLink },
					{ id: "QXR0cmlidXRlOjQx", plainText: form.currency },
					{ id: "QXR0cmlidXRlOjQy", plainText: form.artType },
					{ id: "QXR0cmlidXRlOjQz", plainText: form.printType },
					{ id: "QXR0cmlidXRlOjQ0", plainText: form.frame },
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

				setShowSuccess(true);
				setTimeout(() => setShowSuccess(false), 5000);

				console.log("Producto actualizado con ID:", productId);
			} catch (error) {
				console.error("Error actualizando producto:", error);
			} finally {
				setIsLoading(false);
				setSubmitted(false);
				setFilesToUpload([]);
				const segments = pathname.split("/").filter(Boolean);
				const parentLevels = 2;
				const base = "/" + segments.slice(0, -parentLevels).join("/");
				router.push(base || "/");
			}
		} else {
			e.preventDefault();
			setSubmitted(true);

			if (!validateForm()) {
				setIsLoading(false);
				setSubmitted(false);
				return;
			}
			setIsLoading(true);

			try {
				const descriptionJSON = JSON.stringify({
					blocks: [{ type: "paragraph", data: { text: form.description } }],
					version: "2.0",
				});

				const baseSlug = slugify(form.title, { lower: true });
				const uniqueSlug = `${baseSlug}-${uuidv4()}`;

				const createVars = {
					name: form.title,
					slug: uniqueSlug,
					productType: "UHJvZHVjdFR5cGU6NQ==",
					category: form.artCategory,
					description: descriptionJSON,
					attributes: [
						// { id: "QXR0cmlidXRlOjk=", boolean: form.signature },
						{ id: "QXR0cmlidXRlOjU=", plainText: form.email },
						...(form.dimensions ? [{ id: "QXR0cmlidXRlOjUx", plainText: form.unit }] : []),
						{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
						{ id: "QXR0cmlidXRlOjMw", plainText: form.artisName },
						{ id: "QXR0cmlidXRlOjMy", plainText: form.dimensions },
						...(form.numberOfPrints ? [{ id: "QXR0cmlidXRlOjM0", numeric: form.numberOfPrints }] : []),
						{ id: "QXR0cmlidXRlOjM1", plainText: form.datePainted },
						{ id: "QXR0cmlidXRlOjM3", plainText: form.collection },
						{ id: "QXR0cmlidXRlOjM4", plainText: form.externalLink },
						{ id: "QXR0cmlidXRlOjQx", plainText: form.currency },
						{ id: "QXR0cmlidXRlOjQy", plainText: form.artType },
						{ id: "QXR0cmlidXRlOjQz", plainText: form.printType },
						{ id: "QXR0cmlidXRlOjQ0", plainText: form.frame },
					],
					userId: user?._id || "",
					userData: JSON.stringify(user),
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
				setShowSuccess(true);
				setTimeout(() => setShowSuccess(false), 5000);
				console.log("Artwork created with ID", productId);
			} catch (error) {
				console.error("Error creating artwork:", error);
			} finally {
				setIsLoading(false);
				setSubmitted(false);
				setFilesToUpload([]);
				setForm({
					title: "",
					artisName: "",
					artCategory: "",
					price: "",
					currency: "",
					artType: "",
					dimensions: "",
					unit: "cm",
					email: "",
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
				setFieldErrors({});
				const parent = pathname.split("/").slice(0, -1).join("/") || "/";
				router.push(parent);
			}
		}
	}

	function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files || e.target.files.length === 0) return;
		const newFiles = Array.from(e.target.files);
		setFilesToUpload((prev) => [...prev, ...newFiles]);
		e.target.value = "";
		if (newFiles.length > 0) {
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
			{isLoading && (
				<div className={styles.loadingOverlay}>
					{" "}
					<Loader />
				</div>
			)}
			<div className={styles.formGroup}>
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
			{fieldErrors.images && <small className={styles.errorText}>{fieldErrors.images}</small>}
			<div className={styles.formGroup}>
				{fieldErrors.title && <small className={styles.errorText}>{fieldErrors.title}</small>}
				<input
					type="text"
					name="title"
					value={form.title}
					onChange={handleChange}
					placeholder="Artwork title"
				/>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.artisName && <small className={styles.errorText}>{fieldErrors.artisName}</small>}
				<input
					name="artisName"
					value={form.artisName}
					onChange={handleChange}
					placeholder="Painter name"
				/>{" "}
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.artCategory && <small className={styles.errorText}>{fieldErrors.artCategory}</small>}
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
					{fieldErrors.price && <small className={styles.errorText}>{fieldErrors.price}</small>}
					<input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price" />
				</div>
				<div className={`${styles.formGroup} ${styles.unitGroup}`}>
					{fieldErrors.currency && <small className={styles.errorText}>{fieldErrors.currency}</small>}
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
				<input
					type="text"
					name="artType"
					placeholder="Art type (optional)"
					value={form.artType}
					onChange={handleChange}
				/>
			</div>
			<div className={styles.formRow}>
				<div className={`${styles.formGroup} ${styles.dimensionsGroup}`}>
					<input
						type="text"
						name="dimensions"
						value={form.dimensions}
						onChange={handleChange}
						placeholder="Dimensions (e.g., 30x40) (optional)"
						className={styles.dimensionsInput}
					/>
				</div>
				<div className={`${styles.formGroup} ${styles.unitGroup}`}>
					{fieldErrors.unit && <small className={styles.errorText}>{fieldErrors.unit}</small>}
					<select value={form.unit} name="unit" onChange={handleChange}>
						<option value="" disabled>
							cm / in
						</option>
						<option value="QXR0cmlidXRlVmFsdWU6MTI0Nw==">cm</option>
						<option value="QXR0cmlidXRlVmFsdWU6MTI0OA==">in</option>
					</select>
				</div>
			</div>
			<div className={styles.formGroup}>
				<select name="printType" value={form.printType} onChange={handleChange}>
					<option value="">Select Print Type (optional)</option>
					<option value="Q2hvaWNlOjE=">Oil</option>
					<option value="Q2hvaWNlOjI=">Watercolor</option>
				</select>
			</div>
			<div className={styles.formGroup}>
				<input
					type="number"
					name="numberOfPrints"
					value={form.numberOfPrints}
					onChange={handleChange}
					placeholder="Number of prints (optional)"
				/>
			</div>
			<div className={styles.formGroup}>
				<input
					type="text"
					name="datePainted"
					value={form.datePainted}
					onChange={handleChange}
					placeholder="Date painted (optional)"
				/>
			</div>
			<div className={styles.formGroup}>
				{fieldErrors.frame && <small className={styles.errorText}>{fieldErrors.frame}</small>}
				<input
					type="text"
					name="frame"
					value={form.frame}
					onChange={handleChange}
					placeholder="Frame (Optional)"
				/>
			</div>
			<div className={styles.formGroup}>
				{fieldErrors.collection && <small className={styles.errorText}>{fieldErrors.collection}</small>}
				<input
					type="text"
					name="collection"
					value={form.collection}
					onChange={handleChange}
					placeholder="Collection (Optional)"
				/>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.description && <small className={styles.errorText}>{fieldErrors.description}</small>}
				<textarea
					name="description"
					placeholder="Description"
					rows={4}
					value={form.description}
					onChange={handleChange}
				/>
			</div>

			<h3 className={styles.sectionTitle}>Contact information</h3>
			<div className={styles.formGroup}>
				{fieldErrors.email && <small className={styles.errorText}>{fieldErrors.email}</small>}
				<input name="email" value={form.email} onChange={handleChange} type="text" placeholder="Email" />
			</div>

			<hr className={styles.fullWidthSeparator} />

			<h3 className={styles.sectionTitle}>Link to artwork</h3>
			<p className={styles.helperText}>
				You can share the link to other websites where your artwork is listed
			</p>
			<div className={styles.formGroup}>
				{fieldErrors.externalLink && <small className={styles.errorText}>{fieldErrors.externalLink}</small>}
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

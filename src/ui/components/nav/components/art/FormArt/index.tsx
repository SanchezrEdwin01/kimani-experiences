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
	const [isLoading, setIsLoading] = useState(false);
	const pathname = usePathname();
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
			{ key: "artType", label: "Art Type" },
			{ key: "dimensions", label: "Dimensions" },
			{ key: "unit", label: "Unit" },
			{ key: "printType", label: "Print Type" },
			{ key: "datePainted", label: "Date Painted" },
			{ key: "frame", label: "Frame" },
			{ key: "collection", label: "Collection" },
			{ key: "description", label: "Description" },
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

		if (filesToUpload.length === 0) {
			errors["images"] = "Image is required. Please upload at least one image.";
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitted(true);

		if (!validateForm()) {
			setIsLoading(false);
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
					{ id: "QXR0cmlidXRlOjk=", boolean: form.signature },
					{ id: "QXR0cmlidXRlOjQx", plainText: form.currency },
					{ id: "QXR0cmlidXRlOjMw", plainText: form.artisName },
					{ id: "QXR0cmlidXRlOjQy", plainText: form.artType },
					{ id: "QXR0cmlidXRlOjQz", plainText: form.printType },
					{ id: "QXR0cmlidXRlOjQ0", plainText: form.frame },
					{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
					{ id: "QXR0cmlidXRlOjM3", plainText: form.collection },
					{ id: "QXR0cmlidXRlOjM4", plainText: form.externalLink },
					...(form.numberOfPrints ? [{ id: "QXR0cmlidXRlOjM0", numeric: form.numberOfPrints }] : []),
					{ id: "QXR0cmlidXRlOjMy", plainText: form.dimensions },
					{ id: "QXR0cmlidXRlOjM1", plainText: form.datePainted },
					{ id: "QXR0cmlidXRlOjI1", plainText: form.description },
					{ id: "QXR0cmlidXRlOjIy", plainText: "0" },
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
			{isLoading && (
				<div className={styles.loadingOverlay}>
					{" "}
					<Loader />
				</div>
			)}
			<div className={styles.formGroup}>
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
				{submitted && fieldErrors.images && <small className={styles.errorText}>{fieldErrors.images}</small>}
			</div>
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
				<input name="artisName" value={form.artisName} onChange={handleChange} placeholder="Painter name" />{" "}
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

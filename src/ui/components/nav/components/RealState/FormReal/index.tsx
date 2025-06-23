"use client";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Country } from "country-state-city";
import slugify from "slugify";
import convert from "heic-convert/browser";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";
import styles from "./RealEstate.module.scss";
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
export interface RealEstateFormData {
	title: string;
	category: string;
	address: string;
	city: string;
	zipCode: string;
	externalLink: string;
	description: string;
	bedrooms: number;
	bathrooms: number;
	country: string;
	email: string;
	currency: string;
	state: string;
	levelListing: string;
	priceOption: string;
	price: string;
	parkingNumber: number;
	propertySize: string;
	sizeUnit: string;
}

// interface CustomState {
// 	name: string;
// 	isoCode: string;
// 	countryCode: string;
// }

// interface CustomCity {
// 	name: string;
// 	countryCode: string;
// 	stateCode: string;
// }

export interface RealEstateFormProps {
	productSlug?: string;
}

export function RealEstateForm({ productSlug }: RealEstateFormProps) {
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [countries] = useState(Country.getAllCountries());
	const { user } = useUser();
	// const [states, setStates] = useState<CustomState[]>([]);
	// const [cities, setCities] = useState<CustomCity[]>([]);
	const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
	const [existingProductId, setExistingProductId] = useState<string>("");
	const initialExistingImages = useRef<{ id: string; url: string }[]>([]);
	const [countryCode, setCountryCode] = useState<string>("");
	// const [stateCode, setStateCode] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
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
		description: "",
		bedrooms: 0,
		bathrooms: 0,
		country: "",
		currency: "",
		email: "",
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

				setFormData({
					title: p.name,
					category: p.category?.id ?? "",
					address: getValue("address"),
					city: getValue("city"),
					zipCode: getValue("zip-code"),
					externalLink: getValue("external-link"),
					description: descText,
					bedrooms: Number(getValue("bedrooms")) || 0,
					bathrooms: Number(getValue("bathrooms")) || 0,
					country: getValue("country"),
					email: getValue("email"),
					currency: getValue("currency"),
					state: getValue("state"),
					levelListing: getValue("level-listing"),
					priceOption: getSelectedValueId("price-options"),
					price: p.pricing?.priceRange?.start?.gross.amount.toString() ?? "",
					parkingNumber: Number(getValue("parking-number")) || 0,
					propertySize: getValue("property-size"),
					sizeUnit: getSelectedValueId("size-unit"),
				});

				setExistingProductId(p.id);

				setSelectedCategory(p.category?.id ?? "");

				// const isoCountry =
				// 	Country.getAllCountries().find((c) => c.name === getValue("country"))?.isoCode ?? "";

				setCountryCode(Country.getAllCountries().find((c) => c.name === getValue("country"))?.isoCode ?? "");

				// const allStates = State.getStatesOfCountry(isoCountry);
				// setStates(allStates);

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
	}

	// function handleStateChange(e: ChangeEvent<HTMLSelectElement>) {
	// 	const iso = e.target.value;
	// 	setStateCode(iso);
	// 	const stateObj = states.find((s) => s.isoCode === iso);
	// 	const stateName = stateObj?.name || "";
	// 	setFormData((prev) => ({
	// 		...prev,
	// 		state: stateName,
	// 		city: "",
	// 	}));
	// 	const stateCities = City.getCitiesOfState(countryCode, iso) || [];
	// 	setCities(stateCities);
	// }

	// function handleCityChange(e: ChangeEvent<HTMLSelectElement>) {
	// 	setFormData((prev) => ({ ...prev, city: e.target.value }));
	// }

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

		if (name === "zipCode") {
			const filtered = value.replace(/[^0-9]/g, "");
			setFormData((prev) => ({ ...prev, [name]: filtered }));
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

		if (name === "propertySize") {
			let filtered = value.replace(/[^0-9.]/g, "");
			const parts = filtered.split(".");
			if (parts.length > 2) filtered = parts.shift() + "." + parts.join("");
			const [intPart, decPart] = filtered.split(".");
			filtered = decPart !== undefined ? intPart + "." + decPart.slice(0, 2) : intPart;

			setFormData((prev) => ({ ...prev, propertySize: filtered }));
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
			{ key: "priceOption", label: "Price Option" },
			{ key: "currency", label: "Currency" },
			{ key: "propertySize", label: "Property Size" },
			{ key: "sizeUnit", label: "Size Unit" },
			{ key: "description", label: "Description" },
			{ key: "bedrooms", label: "Bedrooms" },
			{ key: "bathrooms", label: "Bathrooms" },
			{ key: "parkingNumber", label: "ParkingNumber" },
			{ key: "email", label: "Email" },
		];

		requiredFields.forEach(({ key, label }) => {
			if (!formData[key] || formData[key].toString().trim() === "") {
				errors[key] = `${label} is required.`;
			}
		});

		if (formData.priceOption !== CONTACT_FOR_PRICE_ID && formData.price.trim() === "") {
			errors["price"] = "Price is required.";
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
				setSubmitted(false);
				return;
			}

			setIsLoading(true);

			try {
				const descriptionJSON = JSON.stringify({
					blocks: [{ type: "paragraph", data: { text: formData.description } }],
					version: "2.22.2",
				});

				const attributes = [
					{ id: "QXR0cmlidXRlOjI=", plainText: formData.address },
					{ id: "QXR0cmlidXRlOjEx", plainText: formData.city },
					...(formData.zipCode ? [{ id: "QXR0cmlidXRlOjE0", numeric: formData.zipCode }] : []),
					{ id: "QXR0cmlidXRlOjE5", plainText: formData.externalLink },
					{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
					{ id: "QXR0cmlidXRlOjI1", plainText: formData.description },
					{ id: "QXR0cmlidXRlOjQ1", plainText: formData.state },
					{ id: "QXR0cmlidXRlOjU=", plainText: formData.email },
					{ id: "QXR0cmlidXRlOjQw", plainText: formData.country },
					{ id: "QXR0cmlidXRlOjQx", plainText: formData.currency },
					{ id: "QXR0cmlidXRlOjQ3", plainText: formData.levelListing },
					{ id: "QXR0cmlidXRlOjI3", numeric: String(formData.bedrooms) },
					{ id: "QXR0cmlidXRlOjI4", numeric: String(formData.bathrooms) },
					{ id: "QXR0cmlidXRlOjQ4", dropdown: { id: formData.priceOption } },
					{ id: "QXR0cmlidXRlOjQ5", numeric: String(formData.parkingNumber) },
					{ id: "QXR0cmlidXRlOjUw", numeric: String(formData.propertySize) },
					{ id: "QXR0cmlidXRlOjUx", dropdown: { id: formData.sizeUnit } },
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

			return;
		} else {
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

				const baseSlug = slugify(formData.title, { lower: true });
				const uniqueSlug = `${baseSlug}-${uuidv4()}`;

				const createProductVars = {
					name: formData.title,
					slug: uniqueSlug,
					productType: "UHJvZHVjdFR5cGU6NA==",
					category: formData.category,
					description: descriptionJSON,
					attributes: [
						{ id: "QXR0cmlidXRlOjI=", plainText: formData.address },
						{ id: "QXR0cmlidXRlOjEx", plainText: formData.city },
						...(formData.zipCode ? [{ id: "QXR0cmlidXRlOjE0", numeric: formData.zipCode }] : []),
						{ id: "QXR0cmlidXRlOjE5", plainText: formData.externalLink },
						{ id: "QXR0cmlidXRlOjIy", plainText: user?._id || "1" },
						{ id: "QXR0cmlidXRlOjI1", plainText: formData.description },
						{ id: "QXR0cmlidXRlOjQ1", plainText: formData.state },
						{ id: "QXR0cmlidXRlOjU=", plainText: formData.email },
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
					userId: user?._id || "",
					userData: JSON.stringify(user),
				};

				const toDelete = initialExistingImages.current
					.map((img) => img.id)
					.filter((id) => !existingImages.some((img) => img.id === id));
				for (const imageId of toDelete) {
					await executeGraphQL(DeleteServiceImageDocument, { variables: { id: imageId } });
				}

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
							formData.priceOption === "QXR0cmlidXRlVmFsdWU6MjIw"
								? 0.0
								: parseFloat(formData.price.toString()),
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
					description: "",
					bedrooms: 0,
					bathrooms: 0,
					country: "",
					currency: "",
					email: "",
					state: "",
					levelListing: "",
					price: "",
					priceOption: "",
					parkingNumber: 0,
					propertySize: "",
					sizeUnit: "",
				});
				setFieldErrors({});
				const parent = pathname.split("/").slice(0, -1).join("/") || "/";
				router.push(parent);
			}
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
					placeholder="Property title"
				/>
			</div>

			<div className={styles.formGroup}>
				{fieldErrors.levelListing && <small className={styles.errorText}>{fieldErrors.levelListing}</small>}

				<select name="levelListing" value={formData.levelListing} onChange={handleChange}>
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
							value={formData.address}
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
					<div className={`${styles.formGroup} pb-2`}>
						{fieldErrors.state && <small className={styles.errorText}>{fieldErrors.state}</small>}
						<input
							name="state"
							type="text"
							placeholder="State"
							value={formData.state}
							onChange={handleChange}
						/>
					</div>
					<div className={styles.formGroup}>
						{fieldErrors.city && <small className={styles.errorText}>{fieldErrors.city}</small>}
						<input name="city" type="text" placeholder="City" value={formData.city} onChange={handleChange} />
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
						inputMode="decimal"
						pattern="[0-9]*\.?[0-9]*"
						placeholder="Price"
						value={formData.price}
						onChange={handleChange}
					/>
				</div>
			)}

			<div className={styles.formGroup}>
				{fieldErrors.currency && <small className={styles.errorText}>{fieldErrors.currency}</small>}

				<select name="currency" value={formData.currency} onChange={handleChange}>
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
						Select sqft/sqm
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

			<h3 className={styles.sectionTitle}>Contact information</h3>
			<div className={styles.formGroup}>
				{fieldErrors.email && <small className={styles.errorText}>{fieldErrors.email}</small>}
				<input name="email" value={formData.email} onChange={handleChange} type="text" placeholder="Email" />
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

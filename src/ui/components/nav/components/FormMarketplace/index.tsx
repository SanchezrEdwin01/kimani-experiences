"use client";

import React, { useState, type ChangeEvent, useRef, useEffect } from "react";
import Image from "next/image";
import moment from "moment-timezone";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import { Country, State, City } from "country-state-city";
import PhoneInput from "react-phone-input-2";
import Lottie from "lottie-react";
import styles from "./index.module.scss";
import { executeGraphQL, uploadGraphQL } from "@/lib/graphql";
import {
	CategoryTreeDocument,
	type CategoryTreeQuery,
	CreateServiceProductDocument,
	CreateDefaultVariantDocument,
	PublishProductInChannelDocument,
	PublishVariantInChannelDocument,
	AddProductToCollectionDocument,
	AddServiceImageDocument,
	UpdateProductMetadataDocument,
} from "@/gql/graphql";
import "react-phone-input-2/lib/style.css";
import "./index.scss";
import { SuccessAnimation } from "@/ui/components/nav/components/animation";

interface DayHours {
	enabled: boolean;
	start?: string;
	end?: string;
}

interface FormData {
	title: string;
	serviceType: string;
	subcategory: string;
	discount: string;
	description: string;
	address: string;
	city: string;
	zip: string;
	area: string;
	state: string;
	country: string;
	defaultTz?: string;
	hours: Record<string, DayHours>;
	website: string;
	email: string;
	phone: string;
	years: number;
	contactMethod: string;
	allowDM: boolean;
	socialMediaLink?: string;
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

export function ServiceForm() {
	const [allZones] = useState<string[]>(() => moment.tz.names());
	const [formData, setFormData] = useState<FormData>({
		title: "",
		serviceType: "",
		subcategory: "",
		discount: "",
		description: "",
		address: "",
		city: "",
		zip: "",
		area: "",
		state: "",
		country: "",
		defaultTz: "",
		hours: {
			Monday: { enabled: false },
			Tuesday: { enabled: false },
			Wednesday: { enabled: false },
			Thursday: { enabled: false },
			Friday: { enabled: false },
			Saturday: { enabled: false },
			Sunday: { enabled: false },
		},
		website: "",
		email: "",
		phone: "",
		years: 1,
		contactMethod: "",
		allowDM: true,
		socialMediaLink: "",
	});

	const [editingDay, setEditingDay] = useState<string | null>(null);
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const [alts, setAlts] = useState<string[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [countries] = useState(Country.getAllCountries());
	const [states, setStates] = useState<CustomState[]>([]);
	const [cities, setCities] = useState<CustomCity[]>([]);
	const [phone, setPhone] = useState("");
	const [categories, setCategories] = useState<
		{ id: string; name: string; slug: string; grandchildren: { id: string; name: string; slug: string }[] }[]
	>([]);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		executeGraphQL<CategoryTreeQuery, { slug: string }>(CategoryTreeDocument, {
			variables: { slug: "service-providers" },
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

	function handleCountryChange(e: ChangeEvent<HTMLSelectElement>) {
		const c = e.target.value;
		setFormData((prev) => ({ ...prev, country: c, state: "", city: "" }));
		if (submitted && c) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["country"];
				return newErrors;
			});
		}
		setStates(State.getStatesOfCountry(c) || []);
		setCities([]);
	}

	function handleStateChange(e: ChangeEvent<HTMLSelectElement>) {
		const s = e.target.value;
		setFormData((prev) => ({ ...prev, state: s, city: "" }));
		if (submitted && s) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["state"];
				return newErrors;
			});
		}
		setCities(City.getCitiesOfState(formData.country, s) || []);
	}

	function handleCityChange(e: ChangeEvent<HTMLSelectElement>) {
		setFormData((prev) => ({ ...prev, city: e.target.value }));
		if (submitted && e.target.value) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["city"];
				return newErrors;
			});
		}
	}

	function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
		if (!e.target.files) return;
		const newFiles = Array.from(e.target.files);
		const generatedAlts = newFiles.map(() => uuidv4());
		setFilesToUpload((prev) => [...prev, ...newFiles]);
		setAlts((prev) => [...prev, ...generatedAlts]);
		e.target.value = "";
		if (submitted && newFiles.length > 0) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors["images"];
				return newErrors;
			});
		}
	}

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
		const { name, value, type, checked } = e.target as HTMLInputElement;
		if (name === "hours" && type === "checkbox") {
			setFormData((prev) => ({
				...prev,
				hours: {
					...prev.hours,
					[value]: { ...prev.hours[value], enabled: checked },
				},
			}));
		} else if (type === "checkbox") {
			setFormData((prev) => ({ ...prev, [name]: checked }));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}
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

	function handleRemove(idx: number) {
		setFilesToUpload((prev) => prev.filter((_, i) => i !== idx));
		setAlts((prev) => prev.filter((_, i) => i !== idx));
	}

	function validateForm(): boolean {
		const errors: Record<string, string> = {};
		const requiredFields: { key: keyof FormData; label: string }[] = [
			{ key: "title", label: "Title" },
			{ key: "subcategory", label: "Service Type" },
			{ key: "discount", label: "Discount" },
			{ key: "description", label: "Description" },
			{ key: "address", label: "Address" },
			{ key: "country", label: "Country" },
			{ key: "state", label: "State" },
			{ key: "city", label: "City" },
			{ key: "zip", label: "Zip Code" },
			{ key: "defaultTz", label: "Time Zone" },
			{ key: "website", label: "Website" },
			{ key: "email", label: "Email" },
			{ key: "phone", label: "Phone Number" },
			{ key: "contactMethod", label: "Best Contact Method" },
			{ key: "hours", label: "Hours" },
		];

		requiredFields.forEach(({ key, label }) => {
			const value = formData[key];

			if (!value || String(value).trim() === "") {
				errors[key] = `${label} is required.`;
			}
		});

		const hasValidHours = Object.values(formData.hours).some(
			(hour) => hour.enabled && hour.start && hour.end,
		);
		if (!hasValidHours) {
			errors["hour"] = "At least one open hour (start and end)";
		}

		if (filesToUpload.length === 0) {
			errors["images"] = "At least one image is required.";
		}
		if (
			formData.contactMethod === "socialMedia" &&
			(!formData.socialMediaLink || formData.socialMediaLink.trim() === "")
		) {
			errors["contactMethod"] = "Social media link";
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	}

	function resetForm() {
		setFormData({
			title: "",
			serviceType: "",
			subcategory: "",
			discount: "",
			description: "",
			address: "",
			city: "",
			zip: "",
			area: "",
			state: "",
			country: "",
			defaultTz: "",
			hours: {
				Monday: { enabled: false },
				Tuesday: { enabled: false },
				Wednesday: { enabled: false },
				Thursday: { enabled: false },
				Friday: { enabled: false },
				Saturday: { enabled: false },
				Sunday: { enabled: false },
			},
			website: "",
			email: "",
			phone: "",
			years: 1,
			contactMethod: "",
			allowDM: true,
			socialMediaLink: "",
		});
		setFilesToUpload([]);
		setAlts([]);
		setPhone("");
		setStates([]);
		setCities([]);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitted(true);

		if (!validateForm()) {
			return;
		}
		const availability = JSON.stringify(
			Object.entries(formData.hours)
				.filter(([, h]) => h.enabled && h.start && h.end)
				.map(([day, h]) => ({
					day,
					from: h.start,
					to: h.end,
					tz: formData.defaultTz,
				})),
		);

		const descriptionJSON = JSON.stringify({
			blocks: [{ type: "paragraph", data: { text: formData.description } }],
			version: "2.22.2",
		});

		const createProductVars = {
			name: formData.title,
			slug: slugify(formData.title, { lower: true }),
			productType: "UHJvZHVjdFR5cGU6Mg==",
			category: formData.subcategory,
			description: descriptionJSON,
			attributes: [
				{ id: "QXR0cmlidXRlOjI=", plainText: formData.address },
				{ id: "QXR0cmlidXRlOjEx", plainText: formData.city },
				{ id: "QXR0cmlidXRlOjE0", numeric: formData.zip },
				{ id: "QXR0cmlidXRlOjQ1", plainText: formData.state },
				{ id: "QXR0cmlidXRlOjQw", plainText: formData.country },
				{ id: "QXR0cmlidXRlOjE=", numeric: formData.discount.replace("%", "") },
				{ id: "QXR0cmlidXRlOjQ=", plainText: formData.website },
				{ id: "QXR0cmlidXRlOjU=", plainText: formData.email },
				{ id: "QXR0cmlidXRlOjY=", plainText: formData.phone },
				{ id: "QXR0cmlidXRlOjc=", numeric: String(formData.years) },
				{ id: "QXR0cmlidXRlOjE1", plainText: formData.contactMethod },
				{ id: "QXR0cmlidXRlOjk=", boolean: formData.allowDM },
			],
		};

		const createData = await executeGraphQL(CreateServiceProductDocument, {
			variables: createProductVars,
		});
		const productId = createData?.productCreate?.product?.id;
		if (!productId || createData.productCreate?.errors.length) {
			console.error(createData.productCreate?.errors);
			return;
		}

		await executeGraphQL(UpdateProductMetadataDocument, {
			variables: { id: productId, input: [{ key: "availability", value: availability }] },
		});

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
				price: parseFloat(formData.discount),
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
					alt: alts[i],
				});
			}
		}

		console.log("Servicio creado con ID:", productId);
		resetForm();
		setShowSuccess(true);
		setTimeout(() => {
			setShowSuccess(false);
		}, 5000);
		setShowSuccess(true);
	}

	return (
		<form className={styles.formContainer} onSubmit={handleSubmit}>
			<div className={`${styles.imagesUploader} ${filesToUpload.length ? styles.hasImages : ""}`}>
				{filesToUpload.map((file, idx) => {
					const objectUrl = URL.createObjectURL(file);
					return (
						<div className={styles.thumbWrapper} key={idx}>
							<button type="button" className={styles.deleteBtn} onClick={() => handleRemove(idx)}>
								×
							</button>
							<Image
								src={objectUrl}
								alt={alts[idx] || `Image ${idx + 1}`}
								width={700}
								height={400}
								className={styles.thumb}
							/>
						</div>
					);
				})}
				<div className={`${styles.thumbWrapper} ${styles.addButton}`}>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className={styles.uploadButton}
						style={{ fontSize: "23px" }}
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
			{submitted && fieldErrors.title && <small className={styles.errorText}>{fieldErrors.title}</small>}
			<input type="text" name="title" placeholder="Title of the service" onChange={handleChange} />
			{submitted && fieldErrors.subcategory && (
				<small className={styles.errorText}>{fieldErrors.subcategory}</small>
			)}
			<select name="subcategory" value={formData.subcategory} onChange={handleChange}>
				<option value="">Service type</option>
				{categories.map((cat) => (
					<optgroup key={cat.id} label={cat.name}>
						{cat.grandchildren.map((grand) => (
							<option key={grand.id} value={grand.id}>
								{grand.name}
							</option>
						))}
					</optgroup>
				))}
			</select>
			{submitted && fieldErrors.discount && (
				<small className={styles.errorText}>{fieldErrors.discount}</small>
			)}
			<input
				type="number"
				name="discount"
				placeholder="Discount (%)"
				min={1}
				max={100}
				value={formData.discount.replace("%", "")}
				onChange={(e) => {
					const v = e.target.value;
					const i = Math.max(1, Math.min(100, Number(v)));
					setFormData((prev) => ({
						...prev,
						discount: v ? `${i}%` : "",
					}));
					if (submitted && v) {
						setFieldErrors((prev) => {
							const newErrors = { ...prev };
							delete newErrors["discount"];
							return newErrors;
						});
					}
				}}
			/>
			{submitted && fieldErrors.description && (
				<small className={styles.errorText}>{fieldErrors.description}</small>
			)}
			<textarea name="description" placeholder="Description" rows={3} onChange={handleChange} />

			<div className={styles.sectionDivider} />

			<div>
				<div className={styles.sectionTitle}>Location details</div>
				<div className={styles.location}>
					{submitted && fieldErrors.address && (
						<small className={styles.errorText}>{fieldErrors.address}</small>
					)}
					<input type="text" name="address" placeholder="Address" onChange={handleChange} />
					{submitted && fieldErrors.country && (
						<small className={styles.errorText}>{fieldErrors.country}</small>
					)}
					<select name="country" value={formData.country} onChange={handleCountryChange}>
						<option value="">Select Country</option>
						{countries.map((c) => (
							<option key={c.isoCode} value={c.isoCode}>
								{c.name}
							</option>
						))}
					</select>
					{submitted && fieldErrors.state && <small className={styles.errorText}>{fieldErrors.state}</small>}
					<select name="state" value={formData.state} onChange={handleStateChange} disabled={!states.length}>
						<option value="">State</option>
						{states.map((s) => (
							<option key={s.isoCode} value={s.isoCode}>
								{s.name}
							</option>
						))}
					</select>

					<div className={styles.cityZipRow}>
						{submitted && fieldErrors.city && <small className={styles.errorText}>{fieldErrors.city}</small>}
						<select name="city" onChange={handleCityChange} disabled={!cities.length}>
							<option value="">City</option>
							{cities.map((ct) => (
								<option key={ct.name} value={ct.name}>
									{ct.name}
								</option>
							))}
						</select>
						{submitted && fieldErrors.zip && <small className={styles.errorText}>{fieldErrors.zip}</small>}
						<input
							type="text"
							name="zip"
							placeholder="Zip code"
							className={styles.zipCode}
							onChange={handleChange}
						/>
					</div>
				</div>
			</div>

			<div className={styles.sectionDivider} />

			<div className={styles.sectionTitle}>Time zone</div>
			<label className={styles.timezoneSelect}>
				{submitted && fieldErrors.defaultTz && (
					<small className={styles.errorText}>{fieldErrors.defaultTz}</small>
				)}
				<select
					name="defaultTz"
					value={formData.defaultTz}
					onChange={(e) => {
						setFormData((prev) => ({ ...prev, defaultTz: e.target.value }));
						if (submitted && e.target.value) {
							setFieldErrors((prev) => {
								const newErrors = { ...prev };
								delete newErrors["defaultTz"];
								return newErrors;
							});
						}
					}}
				>
					<option value="">— Select a time zone —</option>
					{allZones.map((zone) => (
						<option key={zone} value={zone}>
							{zone}
						</option>
					))}
				</select>
			</label>

			<div className={styles.sectionDivider} />

			<div className={styles.sectionTitle}>Open hours</div>
			{submitted && fieldErrors.hour && <small className={styles.errorText}>{fieldErrors.hour}</small>}
			<div className={styles.openHours}>
				{Object.entries(formData.hours).map(([day, dayData], idx, arr) => (
					<React.Fragment key={day}>
						<label className={styles.dayRow}>
							<div className={styles.dayInfo}>
								<input
									type="checkbox"
									name="hours"
									value={day}
									checked={dayData.enabled}
									onChange={handleChange}
								/>
								<span>{day}</span>
							</div>
							{dayData.enabled ? (
								<button type="button" className={styles.addHoursButton} onClick={() => setEditingDay(day)}>
									{dayData.start && dayData.end ? `${dayData.start} - ${dayData.end}` : "Add hours"}
								</button>
							) : (
								<span className={styles.status}>Closed</span>
							)}
						</label>
						{idx < arr.length - 1 && <hr className={styles.daySeparator} />}
					</React.Fragment>
				))}
			</div>

			{editingDay && (
				<div className={styles.modalOverlay}>
					<div className={styles.modal}>
						<h2>Set hours for {editingDay}</h2>
						<label className={styles.timeLabel}>
							Start:
							<input
								type="time"
								value={formData.hours[editingDay].start || ""}
								onChange={(e) => {
									const newStart = e.target.value;
									setFormData((prev) => {
										const updated = {
											...prev,
											hours: {
												...prev.hours,
												[editingDay]: {
													...prev.hours[editingDay],
													start: newStart,
												},
											},
										};

										const hasValidHours = Object.values(updated.hours).some(
											(hour) => hour.enabled && hour.start && hour.end,
										);
										if (submitted && hasValidHours) {
											setFieldErrors((prev) => {
												const newErrors = { ...prev };
												delete newErrors["hour"];
												return newErrors;
											});
										}

										return updated;
									});
								}}
							/>
						</label>
						<label className={styles.timeLabel}>
							End:
							<input
								type="time"
								value={formData.hours[editingDay].end || ""}
								onChange={(e) => {
									const newEnd = e.target.value;
									setFormData((prev) => {
										const updated = {
											...prev,
											hours: {
												...prev.hours,
												[editingDay]: {
													...prev.hours[editingDay],
													end: newEnd,
												},
											},
										};

										const hasValidHours = Object.values(updated.hours).some(
											(hour) => hour.enabled && hour.start && hour.end,
										);
										if (submitted && hasValidHours) {
											setFieldErrors((prev) => {
												const newErrors = { ...prev };
												delete newErrors["hour"];
												return newErrors;
											});
										}

										return updated;
									});
								}}
							/>
						</label>
						<div className={styles.modalActions}>
							<button type="button" onClick={() => setEditingDay(null)}>
								Cancel
							</button>
							<button type="button" onClick={() => setEditingDay(null)}>
								Save
							</button>
						</div>
					</div>
				</div>
			)}

			<div className={styles.sectionDivider} />

			<div>
				<div className={styles.sectionTitle}>Service provider details</div>
				<div className={styles.providerDetails}>
					{submitted && fieldErrors.website && (
						<small className={styles.errorText}>{fieldErrors.website}</small>
					)}
					<input type="url" name="website" placeholder="https://" onChange={handleChange} />
					{submitted && fieldErrors.email && <small className={styles.errorText}>{fieldErrors.email}</small>}
					<input type="email" name="email" placeholder="Email" onChange={handleChange} />
					{submitted && fieldErrors.phone && <small className={styles.errorText}>{fieldErrors.phone}</small>}
					<PhoneInput
						country={"us"}
						value={phone}
						onChange={(phone) => {
							setPhone(phone);
							setFormData((prev) => ({ ...prev, phone }));
							if (submitted && phone) {
								setFieldErrors((prev) => {
									const newErrors = { ...prev };
									delete newErrors["phone"];
									return newErrors;
								});
							}
						}}
						inputProps={{
							name: "phone",
							required: true,
							autoFocus: false,
						}}
						inputStyle={{
							width: "100%",
							backgroundColor: "#1e1e1e",
							color: "white",
							border: "1px solid #444",
						}}
						buttonStyle={{
							backgroundColor: "#1e1e1e",
							border: "1px solid #444",
						}}
						containerClass={styles.customPhoneContainer}
					/>

					<div className={styles.years}>
						<span>How long in business</span>
						<button
							type="button"
							onClick={() => setFormData((prev) => ({ ...prev, years: Math.max(1, prev.years - 1) }))}
						>
							–
						</button>
						<span>{formData.years}</span>
						<button type="button" onClick={() => setFormData((prev) => ({ ...prev, years: prev.years + 1 }))}>
							+
						</button>
					</div>
					{submitted && fieldErrors.contactMethod && (
						<small className={styles.errorText}>{fieldErrors.contactMethod}</small>
					)}
					<select name="contactMethod" value={formData.contactMethod} onChange={handleChange}>
						<option value="">Best way to contact</option>
						<option value="email">Email</option>
						<option value="phone">Phone</option>
						<option value="socialMedia">Social Media</option>
					</select>

					{formData.contactMethod === "socialMedia" && (
						<input
							type="url"
							name="socialMediaLink"
							placeholder="https://"
							value={formData.socialMediaLink}
							onChange={handleChange}
							className={styles.socialLinkInput}
						/>
					)}

					<label className={styles.toggle}>
						<input type="checkbox" name="allowDM" checked={formData.allowDM} onChange={handleChange} />
						Allow direct messaging
					</label>
				</div>
			</div>

			<button className={styles.submitButton} type="submit">
				Next
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

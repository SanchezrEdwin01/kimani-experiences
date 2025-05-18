"use client";

import React, { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import slugify from "slugify";
import { Country, State, City } from "country-state-city";
import styles from "./LuxuryGoodsForm.module.scss";
import {
	CreateServiceProductDocument,
	CreateDefaultVariantDocument,
	PublishProductInChannelDocument,
	PublishVariantInChannelDocument,
	AddProductToCollectionDocument,
	AddServiceImageDocument,
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
		price: "",
		currency: "",
		condition: "",
		description: "",
		externalLink: "",
		brandName: "",
	});
	const [files, setFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [countries] = useState(Country.getAllCountries());
	const [states, setStates] = useState<CustomState[]>([]);
	const [cities, setCities] = useState<CustomCity[]>([]);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
		const { name, value } = e.target;
		setForm((f) => ({ ...f, [name]: value }));
	}

	function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files) return;
		setFiles((f) => [...f, ...Array.from(e.target.files as FileList)]);
		e.target.value = "";
	}

	function handleRemove(i: number) {
		setFiles((f) => f.filter((_, idx) => idx !== i));
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

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

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
				{ id: "QXR0cmlidXRlOjEy", values: [form.country.toLowerCase()] },
				{ id: "QXR0cmlidXRlOjEz", values: [form.state.toLowerCase()] },
				{ id: "QXR0cmlidXRlOjE0", numeric: form.zip },
				{ id: "QXR0cmlidXRlOjE2", plainText: form.area },
				{ id: "QXR0cmlidXRlOjE3", values: [form.currency.toLowerCase()] },
				{ id: "QXR0cmlidXRlOjE4", values: [form.condition.toLowerCase()] },
				{ id: "QXR0cmlidXRlOjI1", plainText: form.description },
				{ id: "QXR0cmlidXRlOjIx", plainText: form.brandName },
				{ id: "QXR0cmlidXRlOjIy", plainText: "" },
				{ id: "QXR0cmlidXRlOjIz", plainText: form.externalLink },
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

		for (const file of files) {
			await uploadGraphQL(AddServiceImageDocument, {
				product: productId,
				image: file,
				alt: form.title,
			});
		}
	}

	return (
		<div className={styles.formWrapper} style={{ position: "relative" }}>
			<form className={styles.formContainer} onSubmit={handleSubmit}>
				<div className={`${styles.imageUpload} ${files.length ? styles.hasImages : ""}`}>
					{files.map((file, idx) => {
						const url = URL.createObjectURL(file);
						return (
							<div className={styles.thumbWrapper} key={idx}>
								<button type="button" className={styles.deleteButton} onClick={() => handleRemove(idx)}>
									×
								</button>
								<Image src={url} alt="" width={700} height={400} className={styles.thumbnail} />
							</div>
						);
					})}
					<button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadButton}>
						＋
					</button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*"
						onChange={handleFilesChange}
						style={{ display: "none" }}
					/>
				</div>

				<div className={styles.formGroup}>
					<input name="title" value={form.title} onChange={handleChange} placeholder="Title of luxury good" />
				</div>

				<div className={styles.formGroup}>
					<select name="category" value={form.category} onChange={handleChange}>
						<option value="" disabled>
							Category of good
						</option>
						<option value="Q2F0ZWdvcnk6MTYz">Jewelry</option>
						<option value="Q2F0ZWdvcnk6MTY0">Collectibles</option>
						<option value="Q2F0ZWdvcnk6MTY1">Watches</option>
					</select>
				</div>

				<div className={styles.formGroup}>
					<input name="brandName" value={form.brandName} onChange={handleChange} placeholder="Brand name" />
				</div>

				<h3 className={styles.sectionTitle}>Location details</h3>
				<hr className={styles.fullWidthSeparator} />

				<div className={styles.formRow}>
					<div className={styles.formGroup}>
						<div className="location">
							<select name="country" onChange={handleCountryChange}>
								<option value="">Select Country</option>
								{countries.map((c) => (
									<option key={c.isoCode} value={c.isoCode}>
										{c.name}
									</option>
								))}
							</select>
							<select name="city" onChange={handleStateChange}>
								<option value="">State</option>
								{states.map((s) => (
									<option key={s.isoCode} value={s.isoCode}>
										{s.name}
									</option>
								))}
							</select>

							<select name="city" onChange={handleCityChange} disabled={!cities.length}>
								<option value="">City</option>
								{cities.map((city) => (
									<option key={city.name} value={city.name}>
										{city.name}
									</option>
								))}
							</select>
							<input
								type="text"
								name="address"
								placeholder="Address"
								onChange={handleChange}
								className={"pb-4"}
							/>

							<input
								type="text"
								name="zip"
								placeholder="Zip code"
								className="zip-code"
								onChange={handleChange}
							/>
						</div>
					</div>
				</div>

				<h3 className={styles.sectionTitle}>Price details</h3>
				<hr className={styles.fullWidthSeparator} />
				<div className={styles.formRow}>
					<div className={styles.formGroup}>
						<input
							name="price"
							type="number"
							value={form.price}
							onChange={handleChange}
							placeholder="Price"
						/>
					</div>

					<div className={styles.formGroup}>
						<select name="currency" value={form.currency} onChange={handleChange}>
							<option value="" disabled>
								Currency
							</option>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
						</select>
					</div>
				</div>
				<h3 className={styles.sectionTitle}>Product details</h3>
				<hr className={styles.fullWidthSeparator} />

				<div className={styles.formGroup}>
					<select name="condition" value={form.condition} onChange={handleChange}>
						<option value="" disabled>
							Condition
						</option>
						<option value="new">New</option>
						<option value="like new">Like New</option>
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
		</div>
	);
}

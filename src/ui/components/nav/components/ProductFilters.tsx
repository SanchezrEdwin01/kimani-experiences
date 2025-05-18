// ui/components/nav/components/ProductFilters.tsx
"use client";

import { useState, useEffect } from "react";

interface CategoryOption {
	slug: string;
	name: string;
}

interface ProductFiltersProps {
	searchValue: string;
	onSearch: (term: string) => void;
	categoryOptions: CategoryOption[];
	selectedCategory?: string;
	onCategoryChange: (slug?: string) => void;
	priceRange: { min: number; max: number };
	onPriceChange: (min: number, max: number) => void;
	sortDirection: "asc" | "desc";
	onSortChange: (direction: "asc" | "desc") => void;
}

export function ProductFilters({
	searchValue,
	onSearch,
	categoryOptions,
	selectedCategory,
	onCategoryChange,
	priceRange,
	onPriceChange,
	sortDirection,
	onSortChange,
}: ProductFiltersProps) {
	const [localMin, setLocalMin] = useState(priceRange.min);
	const [localMax, setLocalMax] = useState(priceRange.max);

	useEffect(() => {
		setLocalMin(priceRange.min);
		setLocalMax(priceRange.max);
	}, [priceRange]);

	return (
		<div className="product-filters flex flex-wrap gap-4 rounded bg-white p-4 shadow">
			<input
				type="text"
				className="flex-grow rounded border px-3 py-2"
				placeholder="Buscar producto..."
				value={searchValue}
				onChange={(e) => onSearch(e.target.value)}
			/>

			<select
				className="rounded border px-3 py-2"
				value={selectedCategory ?? ""}
				onChange={(e) => onCategoryChange(e.target.value || undefined)}
			>
				<option value="">Todas las categorías</option>
				{categoryOptions.map((opt) => (
					<option key={opt.slug} value={opt.slug}>
						{opt.name}
					</option>
				))}
			</select>

			<div className="flex items-center space-x-2">
				<input
					type="number"
					className="w-20 rounded border px-2 py-1"
					value={localMin}
					onChange={(e) => setLocalMin(Number(e.target.value))}
					onBlur={() => onPriceChange(localMin, localMax)}
				/>
				<span>–</span>
				<input
					type="number"
					className="w-20 rounded border px-2 py-1"
					value={localMax}
					onChange={(e) => setLocalMax(Number(e.target.value))}
					onBlur={() => onPriceChange(localMin, localMax)}
				/>
			</div>

			<select
				className="rounded border px-3 py-2"
				value={sortDirection}
				onChange={(e) => onSortChange(e.target.value as "asc" | "desc")}
			>
				<option value="asc">Precio: menor a mayor</option>
				<option value="desc">Precio: mayor a menor</option>
			</select>
		</div>
	);
}

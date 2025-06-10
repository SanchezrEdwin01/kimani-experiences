"use client";

import { useState, useEffect, useRef } from "react";
import { Cog6ToothIcon, ChevronDownIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Country, City, type ICountry, type ICity } from "country-state-city";
import "./index.scss";

interface LocationSelectorProps {
	onLocationChange?: (country?: ICountry, city?: ICity) => void;
	onSettingsClick?: () => void;
	currentLocation?: { country: string; city?: string };
}

export const MarketplaceActions: React.FC<LocationSelectorProps> = ({
	onLocationChange = () => {},
	onSettingsClick = () => {},
	currentLocation,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [countries, setCountries] = useState<ICountry[]>([]);
	const [cities, setCities] = useState<ICity[]>([]);
	const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
	const [selectedCity, setSelectedCity] = useState<ICity | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setCountries(Country.getAllCountries());
	}, []);

	useEffect(() => {
		const allCountries = Country.getAllCountries();
		if (currentLocation && currentLocation.country) {
			const foundCountry = allCountries.find((c) => c.name === currentLocation.country);
			if (foundCountry) {
				setSelectedCountry(foundCountry);
				if (currentLocation.city) {
					const countryCities = City.getCitiesOfCountry(foundCountry.isoCode) || [];
					const foundCity = countryCities.find((ci) => ci.name === currentLocation.city);
					setSelectedCity(foundCity || null);
				} else {
					setSelectedCity(null);
				}
			} else {
				setSelectedCountry(null);
				setSelectedCity(null);
			}
		} else {
			setSelectedCountry(null);
			setSelectedCity(null);
		}
	}, [currentLocation]);

	useEffect(() => {
		if (selectedCountry) {
			setCities(City.getCitiesOfCountry(selectedCountry.isoCode) || []);
		} else {
			setCities([]);
		}
	}, [selectedCountry]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleToggle = () => setIsOpen((prev) => !prev);

	const handleSelectCountry = (country: ICountry) => {
		setSelectedCountry(country);
		setSelectedCity(null);
		onLocationChange(country);
	};

	const handleSelectCity = (city: ICity) => {
		setSelectedCity(city);
		if (selectedCountry) {
			onLocationChange(selectedCountry, city);
		}
		setIsOpen(false);
	};

	const handleClearLocation = () => {
		setSelectedCountry(null);
		setSelectedCity(null);
		onLocationChange?.();
		setIsOpen(false);
	};

	const displayLocationText = selectedCity
		? `${selectedCity.name}, ${selectedCountry?.name}`
		: selectedCountry
		? selectedCountry.name
		: "Global Destinations";

	return (
		<div className="location-selector relative flex items-center justify-between bg-gray-900 px-4 py-2 text-white">
			<button
				type="button"
				onClick={handleToggle}
				className="location-dropdown ml-auto flex flex-col items-center focus:outline-none"
			>
				<span className="text-xs text-gray-400">Location</span>
				<div className="flex items-center space-x-1">
					<MapPinIcon className="h-6 w-6 text-white" />
					<span className="text-base font-medium">{displayLocationText}</span>
					<ChevronDownIcon className="h-6 w-6 text-white" />
				</div>
			</button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className="bg-gray dropdown-custom absolute left-[70px] top-[55px] z-50 max-h-[50vh] w-60 overflow-y-auto rounded py-2 text-white shadow-lg"
				>
					<button
						className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-slate-700"
						onClick={handleClearLocation}
					>
						Global Destinations
					</button>
					{!selectedCountry &&
						countries.map((c) => (
							<button
								key={c.isoCode}
								className="w-full px-4 py-2 text-left hover:bg-slate-700"
								onClick={() => handleSelectCountry(c)}
							>
								{c.name}
							</button>
						))}

					{selectedCountry && (
						<>
							<button
								className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-700"
								onClick={() => {
									setSelectedCountry(null);
									setSelectedCity(null);
								}}
							>
								← Back to countries
							</button>
							{cities.length > 0 ? (
								cities.map((ci) => (
									<button
										key={ci.name + (ci.stateCode || "") + ci.latitude}
										className="w-full px-4 py-2 text-left hover:bg-slate-700"
										onClick={() => handleSelectCity(ci)}
									>
										{ci.name}
									</button>
								))
							) : (
								<div className="p-4 text-sm text-slate-500">
									No cities found for {selectedCountry.name}. Select country to see all results.
								</div>
							)}
						</>
					)}
				</div>
			)}

			<button
				type="button"
				onClick={onSettingsClick}
				className="ml-4 focus:outline-none"
				aria-label="Open settings"
			>
				<Cog6ToothIcon className="h-6 w-6 text-white hover:text-gray-400" />
			</button>
		</div>
	);
};

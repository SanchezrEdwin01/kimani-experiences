// src/utils/locationService.ts

import { Country, State, City } from "country-state-city";

export function getCountries() {
	return Country.getAllCountries();
}

export function getStatesByCountry(countryCode: string) {
	return State.getStatesOfCountry(countryCode) || [];
}

export function getCitiesByState(countryCode: string, stateCode: string) {
	return City.getCitiesOfState(countryCode, stateCode) || [];
}

export function getCitiesByCountry(countryCode: string) {
	return City.getCitiesOfCountry(countryCode) || [];
}

export interface DayHours {
	enabled: boolean;
	from: string;
	to: string;
}

export interface FormData {
	title: string;
	serviceType: string;
	discount: string;
	description: string;
	address: string;
	city: string;
	zip: string;
	state: string;
	country: string;
	timezone: string;
	hours: Record<string, DayHours>;
	website: string;
	email: string;
	phone: string;
	years: number;
	contactMethod: string;
	allowDM: boolean;
}

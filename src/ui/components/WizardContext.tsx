import { type ReactNode, createContext, useContext, useState } from "react";

export interface DayHours {
	enabled: boolean;
	start?: string;
	end?: string;
}

export interface WizardData {
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
	defaultTz: string;
	hours: Record<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday", DayHours>;

	website: string;
	email: string;
	phone: string;
	years: number;
	contactMethod: string;
	allowDM: boolean;
	socialMediaLink?: string;
	acceptedTermsConditions: boolean;

	coverageOption?: "one" | "ten" | "worldwide";
	planId?: string;
	planPrice?: number;

	stripeSessionId?: string;
	paymentStatus?: "pending" | "success" | "failed";
}

export const defaultWizardData: WizardData = {
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
	socialMediaLink: undefined,
	acceptedTermsConditions: false,

	coverageOption: undefined,
	planId: undefined,
	planPrice: undefined,

	stripeSessionId: undefined,
	paymentStatus: undefined,
};

interface WizardState {
	currentStep: number;
	data: WizardData;
	setData: (upd: Partial<WizardData>) => void;
	next: () => void;
	back: () => void;
}

const WizardContext = createContext<WizardState | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
	const [currentStep, setCurrentStep] = useState(0);
	const [data, setDataState] = useState<WizardData>(defaultWizardData);

	const setData = (upd: Partial<WizardData>) => setDataState((prev) => ({ ...prev, ...upd }));
	const next = () => setCurrentStep((s) => Math.min(s + 1, 2));
	const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

	return (
		<WizardContext.Provider value={{ currentStep, data, setData, next, back }}>
			{children}
		</WizardContext.Provider>
	);
}

export const useWizard = () => {
	const ctx = useContext(WizardContext);
	if (!ctx) throw new Error("useWizard debe usarse dentro de WizardProvider");
	return ctx;
};

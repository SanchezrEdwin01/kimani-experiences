// ui/components/.../Wizard.tsx
import { useWizard } from "./WizardContext";
import { Step1 } from "./steps/Step1";
import { Step2 } from "./steps/Step2";

export function Wizard() {
	const { currentStep, next, back } = useWizard();

	return (
		<div>
			{currentStep === 0 && <Step1 onNext={next} />}
			{currentStep === 1 && <Step2 onNext={next} onBack={back} />}
		</div>
	);
}

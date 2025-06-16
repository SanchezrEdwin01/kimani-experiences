"use client";

import React, { useState } from "react";
import { useWizard } from "@/ui/components/WizardContext";

const planOptions = [
	{ id: "plan_one", label: "1 city", price: 49 },
	{ id: "plan_ten", label: "10 cities", price: 199 },
	{ id: "plan_world", label: "Worldwide", price: 499 },
];

interface Step2Props {
	onBack: () => void;
	onNext: () => void;
}

export function Step2({ onBack, onNext }: Step2Props) {
	const { data, setData } = useWizard();
	const [selectedPlan, setSelectedPlan] = useState<{
		id?: string;
		price?: number;
		coverageOption?: "one" | "ten" | "worldwide";
	}>({
		id: data.planId,
		price: data.planPrice,
		coverageOption: data.coverageOption,
	});
	const [error, setError] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedPlan.id) {
			setError("Please choose a plan to continue.");
			return;
		}
		setData({
			coverageOption: selectedPlan.coverageOption!,
			planId: selectedPlan.id,
			planPrice: selectedPlan.price!,
		});
		onNext();
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 p-4">
			<h2 className="text-xl font-semibold">Select Your Coverage Plan</h2>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{planOptions.map((plan) => (
					<label
						key={plan.id}
						className={`flex cursor-pointer flex-col rounded-lg border p-4
                   ${selectedPlan.id === plan.id ? "ring-2 ring-indigo-500" : ""}`}
					>
						<input
							type="radio"
							name="coverage"
							value={plan.id}
							checked={selectedPlan.id === plan.id}
							onChange={() =>
								setSelectedPlan({
									id: plan.id,
									price: plan.price,
									coverageOption:
										plan.id === "plan_one" ? "one" : plan.id === "plan_ten" ? "ten" : "worldwide",
								})
							}
							className="sr-only"
						/>
						<span className="text-lg font-medium">{plan.label}</span>
						<span className="mt-2 text-2xl font-bold">${plan.price}</span>
					</label>
				))}
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="flex justify-between">
				<button type="button" onClick={onBack} className="rounded bg-gray-200 px-4 py-2">
					Back
				</button>
				<button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white">
					Next: Payment
				</button>
			</div>
		</form>
	);
}

// src/components/DisclaimerCard.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useBaseURL } from "@/checkout/hooks/useBaseURL";

export function DisclaimerCard() {
	const [visible, setVisible] = useState(false);
	const useBase = useBaseURL();

	useEffect(() => {
		const accepted = localStorage.getItem("disclaimerAccepted");
		setVisible(!accepted);
	}, []);

	const accept = () => {
		localStorage.setItem("disclaimerAccepted", "true");
		setVisible(false);
	};

	const decline = () => {
		window.location.href = useBase;
	};

	if (!visible) return null;

	return (
		<div className="bg-gray fixed inset-x-0 bottom-0 z-50 border-t border-gray-300 p-4 shadow-lg">
			<div className="mx-auto flex max-w-3xl flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
				<div className="text-sm text-gray-900 dark:text-gray-100">
					<strong>🛑 Marketplace Listing Disclaimer:</strong> Kimani is a neutral marketplace platform that
					allows users to post, buy, and sell items directly with each other. We do not own, inspect, or
					guarantee the accuracy of any listings, the condition of items, or the legitimacy of offers.
					<div className="mt-2">
						<Link
							href="/marketplace/disclaimer"
							className="inline text-sm text-blue-600 no-underline hover:underline"
						>
							Read more
						</Link>
					</div>
				</div>

				{/* Accept / Decline buttons */}
				<div className="flex flex-shrink-0 space-x-2">
					<button onClick={decline} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
						Decline
					</button>
					<button onClick={accept} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
						Accept
					</button>
				</div>
			</div>
		</div>
	);
}

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DisclaimerPage() {
	const router = useRouter();
	const [canGoBack, setCanGoBack] = useState(false);

	useEffect(() => {
		setCanGoBack(window.history.length > 2);
		localStorage.setItem("disclaimerAccepted", "true");
	}, []);

	const handleBack = () => {
		if (canGoBack) {
			router.back();
		} else {
			router.push("/marketplace");
		}
	};
	return (
		<main className="bg-gray min-h-screen p-6 leading-relaxed text-gray-900 dark:bg-gray-900 dark:text-gray-100">
			<button onClick={handleBack} className="mb-4 inline-flex items-center rounded px-3 py-1.5 text-white">
				← Back
			</button>
			<h1 className="mb-6 text-3xl font-bold text-red-600">🛑 Marketplace Listing Disclaimer</h1>

			<p className="mb-4">
				<strong>Important Notice:</strong> Kimani is a neutral marketplace platform that allows users to post,
				buy, and sell items directly with each other. We do not own, inspect, or guarantee the accuracy of any
				listings, the condition of items, or the legitimacy of offers.
			</p>

			<ol className="mb-6 list-inside list-decimal space-y-3 pl-4">
				<li>
					<strong>No Guarantees:</strong> We do not guarantee the authenticity, quality, legality, or safety
					of any items listed by users.
				</li>
				<li>
					<strong>User Responsibility:</strong> Buyers and sellers are solely responsible for all
					communications, transactions, and agreements made through the platform.
				</li>
				<li>
					<strong>No Liability:</strong> Kimani Life is not liable for any losses, damages, fraud,
					misrepresentation, or disputes that may arise from a transaction.
				</li>
				<li>
					<strong>Scam Awareness:</strong> Always use caution when dealing with strangers. Never share
					personal, financial, or sensitive information outside the platform.
				</li>
				<li>
					<strong>Prohibited Items:</strong> Posting or selling prohibited, illegal, counterfeit, or stolen
					items is strictly forbidden. Violators may be banned and reported to authorities.
				</li>
				<li>
					<strong>Shipping &amp; Payments:</strong> If shipping and payments are arranged independently
					between users, Kimani Life is not responsible for delivery, tracking, or refunds.
				</li>
				<li>
					<strong>Report Abuse:</strong> If you suspect a fraudulent or suspicious listing or user, please
					report it immediately through our platform.
				</li>
			</ol>

			<p className="italic">By continuing to use this service, you acknowledge and accept these terms.</p>
		</main>
	);
}

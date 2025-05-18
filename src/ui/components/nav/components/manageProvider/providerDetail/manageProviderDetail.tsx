"use client";

import { useRouter } from "next/navigation";
import { ProviderDetail } from "./providerDetail";
import "../index.scss";

export const ManageDetail = () => {
	const router = useRouter();
	return (
		<section className="manage-categories-container mt-8 px-6 py-8">
			<h2 className="mb-4 text-center text-xl font-bold text-white">Manage service providers</h2>

			<button
				onClick={() => void router.back()}
				className="back-button mb-4 flex items-center gap-2 text-sm text-xl text-white transition hover:text-black"
			>
				←
			</button>

			<div className="category-list flex flex-col gap-4">
				<ProviderDetail baseRoute="/marketplace/service-providers" />
			</div>
		</section>
	);
};

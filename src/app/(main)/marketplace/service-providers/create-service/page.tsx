"use client";

import { useRouter } from "next/navigation";
import { ServiceForm } from "@/ui/components/nav/components/FormMarketplace/index";

export default function Page() {
	const router = useRouter();

	return (
		<>
			<div className="px-6 py-4">
				<button
					onClick={() => void router.back()}
					className="mb-4 flex items-center gap-2 text-xl text-white transition hover:text-gray-300"
				>
					← Back
				</button>
			</div>
			<ServiceForm />
		</>
	);
}

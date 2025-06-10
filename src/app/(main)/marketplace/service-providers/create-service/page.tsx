"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { UserProvider } from "@/UserKimani/context/UserContext";
import { ServiceForm } from "@/ui/components/nav/components/FormMarketplace/index";

const queryClient = new QueryClient();

export default function Page() {
	const router = useRouter();

	return (
		<QueryClientProvider client={queryClient}>
			<UserProvider>
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
			</UserProvider>
		</QueryClientProvider>
	);
}

// app/experiences/create-experience/page.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ExperienceForm } from "../FormExperiences";
import { UserProvider } from "@/UserKimani/context/UserContext";
import { Footer } from "@/kimani-footer-module";
import { SERVER_ID } from "@/UserKimani/constants/server";

const queryClient = new QueryClient();

export default function CreateExperiencePage() {
	const router = useRouter();

	return (
		<QueryClientProvider client={queryClient}>
			<UserProvider serverId={SERVER_ID}>
				<div>
					<div className="px-6 py-4">
						<button
							onClick={() => router.back()}
							className="mb-4 flex items-center gap-2 text-xl text-white transition hover:text-gray-300"
						>
							← Back
						</button>
					</div>
					<ExperienceForm />
				</div>
			</UserProvider>
			<Footer />
		</QueryClientProvider>
	);
}

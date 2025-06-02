"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/UserKimani/context/UserContext";
import { ProductPage } from "@/ui/components/nav/components/luxury-goods/product-details/Details";

interface ProductDetailPageProps {
	params: {
		slug: string;
	};
}

const queryClient = new QueryClient();

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
	return (
		<div className="min-h-screen bg-black pb-24">
			<QueryClientProvider client={queryClient}>
				<UserProvider>
					<ProductPage slug={params.slug} categoryName="luxury-goods" />
				</UserProvider>
			</QueryClientProvider>
		</div>
	);
}

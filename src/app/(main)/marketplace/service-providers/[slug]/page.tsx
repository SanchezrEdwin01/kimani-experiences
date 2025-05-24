import { ProductPageServiceProviders } from "@/ui/components/nav/components/service-provider/product-details/Details";

interface ProductDetailPageProps {
	params: {
		slug: string;
	};
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
	return (
		<div className="min-h-screen bg-black pb-24">
			<ProductPageServiceProviders slug={params.slug} categoryName="service-providers" />
		</div>
	);
}

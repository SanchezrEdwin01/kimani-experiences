import { ProductPage } from "@/ui/components/nav/components/luxury-goods/product-details/Details";

interface ProductDetailPageProps {
	params: {
		slug: string;
	};
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
	return (
		<div className="min-h-screen bg-black pb-24">
			<ProductPage slug={params.slug} categoryName="luxury-goods" />
		</div>
	);
}

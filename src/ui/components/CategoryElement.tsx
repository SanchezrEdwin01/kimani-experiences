import Link from "next/link";
import Image from "next/image";
import { type CategoryFragment } from "@/gql/graphql";

export function CategoryElement({
	category,
	baseRoute = "",
	loading = "lazy",
}: {
	category: CategoryFragment;
	baseRoute?: string;
	loading?: "eager" | "lazy";
}) {
	const categoryUrl = `${baseRoute}/category/${category.slug}`;
	return (
		<li data-testid="CategoryElement" className="p-2">
			<Link
				href={categoryUrl}
				className="relative block overflow-hidden rounded-lg shadow transition hover:shadow-md"
			>
				{category.backgroundImage?.url && (
					<div className="relative aspect-square w-full">
						<Image
							src={category.backgroundImage.url}
							alt={category.backgroundImage.alt || category.name}
							fill
							className="object-cover"
							loading={loading}
						/>
					</div>
				)}
				<div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4">
					<h3 className="text-sm font-semibold text-white md:text-lg">{category.name}</h3>
				</div>
			</Link>
		</li>
	);
}

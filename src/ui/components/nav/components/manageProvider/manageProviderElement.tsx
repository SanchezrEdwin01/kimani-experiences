// src/ui/components/CategoryElement.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { type CategoryFragment } from "@/gql/graphql";
import { TYPES, MANAGE_PROVIDER_DETAIL } from "@/checkout/utils/constants";

export function ManageProviderElement({
	category,
	loading = "lazy",
}: {
	category: CategoryFragment;
	loading?: "eager" | "lazy";
	baseRoute: string;
}) {
	const router = useRouter();

	const handleView = () => {
		const route = TYPES.find((type) => type.value === MANAGE_PROVIDER_DETAIL)?.route;
		if (route) {
			void router.push(`/${route}?parent=${category.id}`);
		}
	};

	return (
		<>
			<li
				data-testid="CategoryElement"
				className="flex items-center justify-between gap-4 rounded-xl bg-[#2E2C2C] p-4 shadow transition hover:shadow-md"
			>
				<div className="flex-shrink-0">
					{category.backgroundImage?.url && (
						<Image
							src={category.backgroundImage.url}
							alt={category.backgroundImage.alt || category.name}
							width={64}
							height={64}
							className="h-16 w-16 rounded-full object-cover"
							loading={loading}
						/>
					)}
				</div>

				<div className="flex-grow text-white">
					<div className="flex flex-col">
						<h3 className="break-words text-sm font-medium">{category.name}</h3>
						<p className="break-words text-xs text-gray-300">{category.name}</p>
					</div>
				</div>

				<button
					onClick={handleView}
					className="rounded bg-[#fcc419] px-3 py-2 text-sm font-semibold text-black transition hover:brightness-105"
				>
					Manage
				</button>
			</li>
		</>
	);
}

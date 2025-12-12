import React from "react";

interface ExperiencePageProps {
	params: {
		slug: string;
	};
}

export default function ExperiencePage({ params }: ExperiencePageProps) {
	return (
		<div className="min-h-screen p-6">
			<h1 className="text-2xl font-bold">Experience: {params.slug}</h1>
			<p className="mt-2 text-sm text-gray-600">
				Aquí luego vas a cargar los datos de la experiencia &quot;{params.slug}&quot; desde GraphQL.
			</p>
		</div>
	);
}

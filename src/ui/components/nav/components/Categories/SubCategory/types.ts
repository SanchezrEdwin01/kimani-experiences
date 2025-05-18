export interface SubCategoryProps {
	slug: string;
}

export interface BackgroundImage {
	url?: string;
	alt?: string;
}

export interface SubCategoryNode {
	id: string;
	name: string;
	slug: string;
	backgroundImage?: BackgroundImage | null;
}

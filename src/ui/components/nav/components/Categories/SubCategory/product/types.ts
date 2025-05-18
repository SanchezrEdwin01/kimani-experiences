export interface MetadataItem {
	key: string;
	value: string;
}

export interface ReviewItem {
	rating: number;
	comment?: string;
}

/** Typeguard para validar que un objeto es ReviewItem */
export function isReviewItem(item: unknown): item is ReviewItem {
	return (
		typeof item === "object" &&
		item !== null &&
		"rating" in item &&
		typeof (item as ReviewItem).rating === "number"
	);
}

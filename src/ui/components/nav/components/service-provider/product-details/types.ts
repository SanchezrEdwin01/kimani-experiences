export interface Block {
	type: string;
	data: { text: string };
}

export interface DescriptionDoc {
	blocks?: Block[];
}

export interface ReviewItem {
	user: string;
	rating: number;
	comment?: string;
	date?: string;
}

export function isReviewItem(item: unknown): item is ReviewItem {
	if (typeof item !== "object" || item === null) return false;
	const obj = item as Record<string, unknown>;
	return (
		typeof obj.user === "string" &&
		typeof obj.rating === "number" &&
		(obj.comment === undefined || typeof obj.comment === "string") &&
		(obj.date === undefined || typeof obj.date === "string")
	);
}

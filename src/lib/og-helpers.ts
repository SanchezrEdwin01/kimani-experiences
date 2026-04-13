interface EditorJSBlock {
	type: string;
	data?: { text?: string };
}

interface EditorJSContent {
	blocks?: EditorJSBlock[];
}

/**
 * Extracts plain text from an EditorJS JSON description string.
 * Falls back to the raw string if it is not valid EditorJS JSON.
 * Returns at most 160 characters, suitable for OG description tags.
 */
export const extractPlainText = (description: string | null | undefined): string => {
	if (!description) return "";

	try {
		const parsed = JSON.parse(description) as EditorJSContent;
		const text =
			parsed.blocks
				?.filter((b) => b.type === "paragraph" && b.data?.text)
				.map((b) => b.data!.text!)
				.join(" ") ?? "";
		return text.slice(0, 160);
	} catch {
		return description.slice(0, 160);
	}
};

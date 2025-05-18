export function useBaseURL(): string {
	return process.env.NEXT_PUBLIC_BASE_URL || "";
}

export const getUrlParameter = (name: string): string | null => {
	if (typeof window === "undefined") {
		return null;
	}
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
};

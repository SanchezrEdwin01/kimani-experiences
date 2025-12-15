import { useEffect, useState } from "react";

export function useMarketplaceURL(): string {
	const envMarketplaceURL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "";

	const [marketplaceURL, setMarketplaceURL] = useState(envMarketplaceURL);

	useEffect(() => {
		const saved = localStorage.getItem("marketplaceURL");
		if (saved) setMarketplaceURL(saved);
	}, []);

	return marketplaceURL;
}

import { useState, useEffect } from "react";

/**
 */
export function useTimezones(): string[] {
	const [zones, setZones] = useState<string[]>([]);

	useEffect(() => {
		fetch("https://worldtimeapi.org/api/timezone")
			.then((res) => res.json() as Promise<string[]>)
			.then((data) => setZones(data))
			.catch(() => {
				setZones(["America/Mexico_City", "America/Los_Angeles", "America/New_York"]);
			});
	}, []);

	return zones;
}

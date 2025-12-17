import { type FC } from "react";

export type Tab = "explore" | "saved" | "myposts";

interface BottomNavProps {
	activeTab?: Tab;
	onTabChange?: (tab: Tab) => void;
	isLoading?: boolean;
}

export const ConsoleNav: FC<BottomNavProps> = () => {
	// El componente ya no renderiza nada
	return null;
};

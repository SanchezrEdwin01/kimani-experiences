import { type FC } from "react";
import clsx from "clsx";
import { Calendar, Bookmark, Edit } from "lucide-react";

export type Tab = "explore" | "saved" | "myposts";

interface BottomNavProps {
	activeTab?: Tab;
	onTabChange?: (tab: Tab) => void;
	isLoading?: boolean;
}

export const ConsoleNav: FC<BottomNavProps> = ({ activeTab = "explore", onTabChange }) => {
	const items: { key: Tab; label: string; icon: React.ReactNode }[] = [
		{ key: "explore", label: "Explore", icon: <Calendar size={16} /> },
		{ key: "saved", label: "Saved", icon: <Bookmark size={16} /> },
		{ key: "myposts", label: "My posts", icon: <Edit size={16} /> },
	];

	return (
		<nav className="top-[64px] z-20 w-full pb-4">
			<ul className="flex">
				{items.map(({ key, label, icon }) => {
					const isActive = key === activeTab;
					return (
						<li
							key={key}
							onClick={() => onTabChange?.(key)}
							className={clsx(
								"flex-1 cursor-pointer py-2 text-center",
								isActive ? "border-b-2 border-white" : "border-b-2 border-transparent",
							)}
						>
							<div className="flex flex-col items-center text-white">
								{icon}
								<span className={clsx("mt-1 text-xs")}>{label}</span>
							</div>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

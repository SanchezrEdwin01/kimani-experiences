"use client";

import { memo, type MouseEvent } from "react";
import cn from "classnames";

import "./index.scss";

interface Tab {
	title: string;
	onClick: (e: MouseEvent<HTMLDivElement>) => void;
}

interface Props {
	tabs: Tab[];
	active: string;
}

function TabbedNavigationComponent({ tabs, active }: Props) {
	return (
		<nav className="tabs">
			{tabs.map((tab, idx) => (
				<div key={idx} className={cn("tab", { active: tab.title === active })} onClick={tab.onClick}>
					{tab.title}
				</div>
			))}
		</nav>
	);
}

export const TabbedNavigation = memo(TabbedNavigationComponent);

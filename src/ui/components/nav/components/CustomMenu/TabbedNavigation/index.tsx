"use client";

import { memo, useRef, useEffect, type MouseEvent } from "react";
import cn from "classnames";

import "./index.scss";

interface Tab {
	title: string;
	onClick: (e: MouseEvent<HTMLDivElement>) => void;
}

interface Props {
	tabs: Tab[];
	active: string | null;
}

function TabbedNavigationComponent({ tabs, active }: Props) {
	const navRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const nav = navRef.current;
		if (!nav) return;

		const rafId = requestAnimationFrame(() => {
			const activeButton = nav.querySelector<HTMLElement>(".tab.active");
			if (!activeButton) return;

			const targetScrollLeft = activeButton.offsetLeft - nav.offsetWidth / 2 + activeButton.offsetWidth / 2;

			nav.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
		});

		return () => cancelAnimationFrame(rafId);
	}, [active]);

	return (
		<nav ref={navRef} className="tabs" aria-label="Navigation sections">
			{tabs.map((tab, idx) => (
				<div key={idx} className={cn("tab", { active: tab.title === active })} onClick={tab.onClick}>
					<span>{tab.title}</span>
				</div>
			))}
		</nav>
	);
}

export const TabbedNavigation = memo(TabbedNavigationComponent);

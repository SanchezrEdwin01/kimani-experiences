import { useRef, useState, useEffect } from "react";

interface FluidHideOnScrollHeaderProps {
	children: React.ReactNode;
}

export function FluidHideOnScrollHeader({ children }: FluidHideOnScrollHeaderProps) {
	const headerRef = useRef<HTMLDivElement>(null);
	const mainHeaderRef = useRef<HTMLElement | null>(null);
	const [topOffset, setTopOffset] = useState(0);

	useEffect(() => {
		mainHeaderRef.current = document.getElementById("main-header") as HTMLElement;
		if (!mainHeaderRef.current) return;

		const rect = mainHeaderRef.current.getBoundingClientRect();
		setTopOffset(rect.bottom);
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			if (!mainHeaderRef.current) return;

			const rect = mainHeaderRef.current.getBoundingClientRect();

			const headerBottom = rect.bottom;

			if (headerBottom <= 0) {
				setTopOffset(0);
			} else {
				setTopOffset(headerBottom);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div
			ref={headerRef}
			className="bg-gray sticky z-20"
			style={{
				top: `${topOffset}px`,
				transition: "top 0.15s linear",
			}}
		>
			{children}
		</div>
	);
}

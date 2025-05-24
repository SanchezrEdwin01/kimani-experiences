import { useRef, useState, useEffect, type CSSProperties } from "react";

interface FluidHideOnScrollHeaderProps {
	children: React.ReactNode;
	offsetTop?: number;
}

export function FluidHideOnScrollHeader({ children, offsetTop = 98 }: FluidHideOnScrollHeaderProps) {
	const headerRef = useRef<HTMLDivElement>(null);
	const lastScrollY = useRef(0);
	const offsetY = useRef(0);
	const [style, setStyle] = useState<CSSProperties>({
		transform: "translateY(0px)",
		top: `${offsetTop}px`,
	});

	useEffect(() => {
		lastScrollY.current = window.scrollY;
		offsetY.current = 0;

		const handleScroll = () => {
			const currentY = window.scrollY;
			const delta = currentY - lastScrollY.current;
			const h = headerRef.current?.offsetHeight ?? 0;

			offsetY.current = Math.min(0, Math.max(offsetY.current - delta, -h));

			setStyle({
				transform: `translateY(${offsetY.current}px)`,
				top: `${offsetTop}px`,
			});

			lastScrollY.current = currentY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [offsetTop]);

	return (
		<div ref={headerRef} className="bg-gray sticky z-20 transition-transform duration-0" style={style}>
			{children}
		</div>
	);
}

import React from "react";
import "./index.scss";

interface CustomCategoryMessageProps {
	text: string;
}

export const CustomCategoryMessage: React.FC<CustomCategoryMessageProps> = ({ text }) => {
	return (
		<div className="category-banner">
			<h2 className="category-banner__title">{text}</h2>
		</div>
	);
};

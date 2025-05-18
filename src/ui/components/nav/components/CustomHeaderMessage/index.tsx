"use client";

import React from "react";
import "./index.scss";

export const CustomHeaderMessage: React.FC<{ categoryName: string }> = ({ categoryName }) => {
	return (
		<div className="location-selector flex items-center justify-between bg-gray-900 px-4 py-2 text-white">
			{/* Location or category selector */}
			<button
				type="button"
				className="location-dropdown ml-auto flex flex-col items-center focus:outline-none"
			>
				<span className="text-xs text-gray-400">Category</span>
				<div className="flex items-center space-x-1">
					<span className="text-base font-medium">{categoryName}</span>
				</div>
			</button>
		</div>
	);
};

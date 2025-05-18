import React from "react";

export const ConfirmDialog = ({
	open,
	title,
	message,
	onConfirm,
	onCancel,
}: {
	open: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="w-full max-w-sm rounded-lg bg-black p-6">
				<h2 className="mb-4 text-lg font-semibold">{title}</h2>
				<p className="mb-6">{message}</p>
				<div className="flex justify-end space-x-4">
					<button onClick={onCancel} className="rounded bg-white px-4 py-2 text-black hover:bg-gray-300">
						Cancel
					</button>
					<button onClick={onConfirm} className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

import Image from "next/image";
import React from "react";

export function ProviderDetail({}: { baseRoute?: string }) {
	return (
		<>
			<div className="w-full max-w-xs rounded-xl bg-[#2E2C2C] p-4 shadow-md">
				<div className="mb-4 flex items-center gap-4">
					<div className="flex-shrink-0">
						<Image
							src="/provider.jpg"
							alt="Provider"
							width={48}
							height={48}
							className="rounded-full object-cover"
						/>
					</div>
					<div className="text-white">
						<h3 className="text-sm font-semibold">Provider Name</h3>
						<p className="text-xs text-gray-400">Business title</p>
					</div>
				</div>

				<div className="space-y-3">
					<select className="w-full rounded-md bg-[#3B3A3A] text-sm text-white outline-none">
						<option>Destination</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
					</select>
					<select className="w-full rounded-md bg-[#3B3A3A] text-sm text-white outline-none">
						<option>Business type</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
					</select>
					<select className="w-full rounded-md bg-[#3B3A3A]  text-sm text-white outline-none">
						<option>Business category</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
					</select>
					<select className="w-full rounded-md bg-[#3B3A3A]  text-sm text-white outline-none">
						<option>#</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
					</select>
				</div>
			</div>
		</>
	);
}

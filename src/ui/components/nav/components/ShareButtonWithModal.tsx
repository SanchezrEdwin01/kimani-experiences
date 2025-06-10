// src/ui/components/nav/components/ShareButtonWithModal.tsx
"use client";
import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { Copy, Check, Twitter, Facebook, Linkedin, Mail, Instagram } from "lucide-react";
import { ShareIcon } from "@heroicons/react/24/solid";

export function ShareButtonWithModal({ title, text, url }: { title: string; text: string; url: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const copyToClipboard = () => {
		void navigator.clipboard.writeText(url);
		setCopied(true);
	};

	function handleClick(): void {
		async function doShare(): Promise<void> {
			const shareData = { title, text, url };
			if (navigator.canShare?.(shareData)) {
				try {
					await navigator.share(shareData);
				} catch {
					setIsOpen(true);
				}
			} else {
				setIsOpen(true);
			}
		}
		void doShare();
	}

	return (
		<>
			<button aria-label="Share listing" onClick={handleClick} className="p-2">
				<ShareIcon className="h-6 w-6 text-gray-700 hover:text-gray-900" />
			</button>

			<Dialog
				open={isOpen}
				onClose={() => setIsOpen(false)}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
			>
				<Dialog.Panel className="w-80 space-y-4 rounded-lg bg-white p-6">
					<Dialog.Title className="text-lg font-bold">Share listing</Dialog.Title>
					<div className="grid grid-cols-2 gap-3">
						<a
							href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
								url,
							)}&text=${encodeURIComponent(title)}`}
							className="flex items-center gap-2"
							target="_blank"
							rel="noreferrer"
						>
							<Twitter /> Twitter
						</a>
						<a
							href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
							className="flex items-center gap-2"
							target="_blank"
							rel="noreferrer"
						>
							<Facebook /> Facebook
						</a>
						<a
							href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
							className="flex items-center gap-2"
							target="_blank"
							rel="noreferrer"
						>
							<Linkedin /> LinkedIn
						</a>
						<a
							href={`https://www.instagram.com/?url=${encodeURIComponent(url)}`}
							className="flex items-center gap-2"
							target="_blank"
							rel="noreferrer"
						>
							<Instagram size={20} /> Instagram
						</a>
						<a
							href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
								text + "\n\n",
							)}${encodeURIComponent(url)}`}
							className="flex items-center gap-2"
							target="_blank"
							rel="noreferrer"
						>
							<Mail /> Email
						</a>
						<button onClick={copyToClipboard} className="flex items-center gap-2">
							{copied ? <Check /> : <Copy />} {copied ? "Copied!" : "Copy link"}
						</button>
					</div>
				</Dialog.Panel>
			</Dialog>
		</>
	);
}

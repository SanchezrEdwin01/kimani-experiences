// src/kimani-footer-module/components/UserIcon.tsx
"use client";

import React from "react";
import Image from "next/image";
import { type User } from "@/UserKimani/types";
import { getStoredBaseUrl } from "@/UserKimani/lib/useUrlParamsProcessor";

interface UserIconProps {
	target?: User | null;
	size?: number;
	status?: boolean;
	style?: React.CSSProperties;
	className?: string;
}

const FALLBACK_AVATAR =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSIjNjY2Ij48Y2lyY2xlIGN4PSIxNiIgY3k9IjEyIiByPSI2IiBmaWxsPSIjODg4Ii8+PHBhdGggZD0iTTQgMjh2LTJhOCA4IDAgMCAxIDgtOGg4YTggOCAwIDAgMSA4IDh2MiIgZmlsbD0iIzg4OCIvPjwvc3ZnPg==";

function generateFileURL(
	file?: string | { _id: string; tag?: string; filename?: string } | null,
	options?: { max_side?: number },
): string | null {
	if (!file) return null;

	let fileId: string;

	if (typeof file === "object" && "_id" in file) {
		fileId = file._id;
	} else if (typeof file === "string") {
		if (file.startsWith("http://") || file.startsWith("https://")) {
			return file;
		}
		fileId = file;
	} else {
		return null;
	}

	const baseUrl = getStoredBaseUrl();
	const maxSide = options?.max_side || 256;
	return `${baseUrl}/autumn/avatars/${fileId}?max_side=${maxSide}`;
}

export function useStatusColour(user?: User | null): string {
	if (!user) return "#808080";

	if (user.status?.presence) {
		switch (user.status.presence) {
			case "Invisible":
			case "Idle":
				return "#808080";
			case "Focus":
				return "#2196F3";
			case "Busy":
				return "#FF9800";
			case "Online":
			default:
				return "#3ABF7E";
		}
	}

	if (typeof user.online === "boolean") {
		return user.online ? "#3ABF7E" : "#808080";
	}

	return "#3ABF7E";
}

export function UserIcon({ target, size = 32, status = false, style, className }: UserIconProps) {
	const avatarUrl = React.useMemo(() => {
		if (!target) return FALLBACK_AVATAR;
		const avatar = target.avatar;
		const generatedUrl = generateFileURL(avatar, { max_side: 256 });
		if (generatedUrl) return generatedUrl;
		return FALLBACK_AVATAR;
	}, [target]);

	const statusColor = useStatusColour(target);

	// Calcular tamaño del indicador de status proporcionalmente
	const statusSize = Math.max(8, size * 0.3);
	const statusBorderSize = Math.max(2, size * 0.06);

	return (
		<div
			className={className}
			style={{
				position: "relative",
				width: size,
				height: size,
				flexShrink: 0,
				...style,
			}}
		>
			{/* Imagen de avatar */}
			<div
				style={{
					width: "100%",
					height: "100%",
					borderRadius: "50%",
					overflow: "hidden",
					position: "relative",
				}}
			>
				<Image
					src={avatarUrl}
					alt="User avatar"
					width={size}
					height={size}
					draggable={false}
					unoptimized
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						display: "block",
					}}
				/>
			</div>

			{/* Indicador de status */}
			{status && (
				<div
					style={{
						position: "absolute",
						bottom: 0,
						right: 0,
						width: statusSize,
						height: statusSize,
						backgroundColor: statusColor,
						borderRadius: "50%",
						border: `${statusBorderSize}px solid #020202`,
						boxSizing: "content-box",
					}}
				/>
			)}
		</div>
	);
}

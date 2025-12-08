"use client";

import React from "react";
import Image from "next/image";
import { type User, generateFileURL } from "../stores/userStore";

interface UserIconProps {
	target?: User | null;
	size?: number;
	status?: boolean;
	style?: React.CSSProperties;
	className?: string;
}

// Imagen fallback SVG (usuario genérico)
const FALLBACK_AVATAR =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSIjNjY2Ij48Y2lyY2xlIGN4PSIxNiIgY3k9IjEyIiByPSI2IiBmaWxsPSIjODg4Ii8+PHBhdGggZD0iTTQgMjh2LTJhOCA4IDAgMCAxIDgtOGg4YTggOCAwIDAgMSA4IDh2MiIgZmlsbD0iIzg4OCIvPjwvc3ZnPg==";

/**
 * Hook para obtener el color del indicador de estado del usuario
 */
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

		const generatedUrl = generateFileURL(target.avatar, { max_side: 256 });
		if (generatedUrl) return generatedUrl;

		if (target.defaultAvatarURL) return target.defaultAvatarURL;

		return FALLBACK_AVATAR;
	}, [target]);

	const statusColor = useStatusColour(target);
	const maskId = React.useId();

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			className={className}
			style={style}
			aria-hidden="true"
		>
			<defs>
				{status && (
					<mask id={`user-mask-${maskId}`}>
						<rect width="32" height="32" fill="white" rx="16" />
						<circle cx="27" cy="27" r="6" fill="black" />
					</mask>
				)}
			</defs>

			<foreignObject
				x="0"
				y="0"
				width="32"
				height="32"
				mask={status ? `url(#user-mask-${maskId})` : undefined}
			>
				<Image
					src={avatarUrl}
					alt="User avatar"
					width={32}
					height={32}
					draggable={false}
					unoptimized
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						borderRadius: "50%",
					}}
				/>
			</foreignObject>

			{status && <circle cx="27" cy="27" r="5" fill={statusColor} />}
		</svg>
	);
}

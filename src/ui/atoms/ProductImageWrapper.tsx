import NextImage, { type ImageProps } from "next/image";

export const ProductImageWrapper = (props: ImageProps) => {
	return (
		<div className="aspect-square overflow-hidden rounded-xl">
			<NextImage {...props} className="h-full w-full object-cover" />
		</div>
	);
};

/** @type {import('next').NextConfig} */
const config = {
	images: {
		remotePatterns: [
			{
				hostname: "*",
			},
		],
	},
	experimental: {
		typedRoutes: false,
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/experiences",
				permanent: true,
			},
		];
	},
};

export default config;

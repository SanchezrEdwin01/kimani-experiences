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
				destination: "/marketplace/real-estate",
				permanent: true,
			},
			{
				source: "/marketplace",
				destination: "/marketplace/real-estate",
				permanent: true,
			},
		];
	},
};

export default config;

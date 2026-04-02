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
	async headers() {
		return [
			{
				// Allow KIMANI app to embed experiences in an iframe (web + Capacitor native)
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value:
							"frame-ancestors 'self' http://localhost:* capacitor://localhost https://community.kimanilife.com https://staging.kimanilife.com",
					},
				],
			},
		];
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

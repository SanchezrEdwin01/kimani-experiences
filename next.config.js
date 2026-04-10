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
				source: "/.well-known/apple-app-site-association",
				headers: [
					{
						key: "Content-Type",
						value: "application/json",
					},
				],
			},
			{
				// Allow KIMANI app to embed experiences in an iframe (web + Capacitor native)
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value:
							"frame-ancestors 'self' http://localhost:* capacitor://localhost https://app.kimaniclub.com https://dev.kimaniclub.com",
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

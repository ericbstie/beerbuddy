import { serve } from "bun";
import index from "./index.html";

const server = serve({
	async fetch(req) {
		const url = new URL(req.url);

		// Handle API routes
		if (url.pathname === "/api/hello") {
			if (req.method === "GET" || req.method === "PUT") {
				return Response.json({
					message: "Hello, world!",
					method: req.method,
				});
			}
		}

		if (url.pathname.startsWith("/api/hello/")) {
			const name = url.pathname.split("/api/hello/")[1];
			return Response.json({
				message: `Hello, ${name}!`,
			});
		}

		// Serve index.html for all other routes (SPA routing)
		return index;
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);

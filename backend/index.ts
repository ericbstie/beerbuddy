import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ApolloServer } from "@apollo/server";
import fastifyApollo from "@as-integrations/fastify";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { extractTokenFromHeader, verifyToken } from "./src/auth/jwt";
import { type AuthContext, authResolvers } from "./src/auth/resolvers";

const fastify = Fastify({
	logger: true,
});

// Load GraphQL schema from file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = join(__dirname, "src/auth/schema.graphql");
const typeDefs = readFileSync(schemaPath, "utf-8");

// Use resolvers from auth slice
const resolvers = {
	Query: authResolvers.Query,
	Mutation: authResolvers.Mutation,
};

const apolloServer = new ApolloServer<AuthContext>({
	typeDefs,
	resolvers,
});

// Fastify Apollo integration passes (request, reply) directly to context
async function createContext(request: { headers: { authorization?: string } }) {
	const authHeader = request.headers.authorization;
	const token = extractTokenFromHeader(authHeader);
	const payload = token ? verifyToken(token) : null;

	return {
		userId: payload?.userId,
	};
}

const start = async () => {
	try {
		// Register CORS plugin
		await fastify.register(cors, {
			origin: true, // Allow all origins in development
			credentials: true,
		});

		await apolloServer.start();
		await fastify.register(fastifyApollo(apolloServer), {
			context: createContext,
		});

		await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log("Server running at http://localhost:3000");
		console.log("GraphQL endpoint: http://localhost:3000/graphql");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();

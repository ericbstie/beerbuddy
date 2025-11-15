import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ApolloServer } from "@apollo/server";
import fastifyApollo from "@as-integrations/fastify";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { extractTokenFromHeader, verifyToken } from "./src/auth/jwt";
import { type AuthContext, authResolvers } from "./src/auth/resolvers";
import { postResolvers } from "./src/posts/resolvers";
import { followResolvers } from "./src/follows/resolvers";

const fastify = Fastify({
	logger: true,
});

// Load GraphQL schemas from files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authSchemaPath = join(__dirname, "src/auth/schema.graphql");
const postsSchemaPath = join(__dirname, "src/posts/schema.graphql");
const followsSchemaPath = join(__dirname, "src/follows/schema.graphql");
const authTypeDefs = readFileSync(authSchemaPath, "utf-8");
const postsTypeDefs = readFileSync(postsSchemaPath, "utf-8");
const followsTypeDefs = readFileSync(followsSchemaPath, "utf-8");
const typeDefs = [authTypeDefs, postsTypeDefs, followsTypeDefs];

// Combine resolvers from all slices
const resolvers = {
	Query: {
		...authResolvers.Query,
		...postResolvers.Query,
		...followResolvers.Query,
	},
	Mutation: {
		...authResolvers.Mutation,
		...postResolvers.Mutation,
		...followResolvers.Mutation,
	},
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
			origin: [
				"http://localhost:3000",
				"http://127.0.0.1:3000",
				/^http:\/\/localhost:\d+$/,
			],
			credentials: true,
			methods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		});

		await apolloServer.start();
		await fastify.register(fastifyApollo(apolloServer), {
			context: createContext,
		});

		const port = Number(process.env.PORT) || 8000;
		await fastify.listen({ port, host: "0.0.0.0" });
		console.log(`Server running at http://localhost:${port}`);
		console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();

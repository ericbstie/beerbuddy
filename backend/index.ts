import { ApolloServer } from "@apollo/server";
import fastifyApollo from "@as-integrations/fastify";
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";
import { extractTokenFromHeader, verifyToken } from "./src/auth/jwt";
import { type AuthContext, authResolvers } from "./src/auth/resolvers";

const prisma = new PrismaClient();
const fastify = Fastify({
	logger: true,
});

const typeDefs = `#graphql
  type User {
    id: Int!
    email: String!
    name: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    user(id: Int!): User
    me: User
  }

  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
  }
`;

const resolvers = {
	Query: {
		users: async () => {
			const users = await prisma.user.findMany({
				select: {
					id: true,
					email: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			return users.map((user) => ({
				...user,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			}));
		},
		user: async (_: unknown, { id }: { id: number }) => {
			const user = await prisma.user.findUnique({
				where: { id },
				select: {
					id: true,
					email: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			if (!user) {
				return null;
			}
			return {
				...user,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			};
		},
		me: async (_: unknown, __: unknown, context: AuthContext) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const user = await prisma.user.findUnique({
				where: { id: context.userId },
				select: {
					id: true,
					email: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!user) {
				throw new Error("User not found");
			}

			return {
				...user,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			};
		},
	},
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

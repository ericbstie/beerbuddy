import { ApolloServer } from "@apollo/server";
import fastifyApollo from "@as-integrations/fastify";
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";

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

  type Query {
    users: [User!]!
    user(id: Int!): User
  }
`;

const resolvers = {
	Query: {
		users: async () => {
			return await prisma.user.findMany();
		},
		user: async (_: unknown, { id }: { id: number }) => {
			return await prisma.user.findUnique({
				where: { id },
			});
		},
	},
};

const apolloServer = new ApolloServer({
	typeDefs,
	resolvers,
});

const start = async () => {
	try {
		await apolloServer.start();
		await fastify.register(fastifyApollo(apolloServer));

		await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log("Server running at http://localhost:3000");
		console.log("GraphQL endpoint: http://localhost:3000/graphql");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();

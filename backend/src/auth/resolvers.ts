import { prisma } from "../db";
import {
	generateToken,
	hashPassword,
	validateEmail,
	validatePassword,
	verifyPassword,
} from "./index";

export interface AuthContext {
	userId?: number;
}

export const authResolvers = {
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
	Mutation: {
		signup: async (
			_: unknown,
			args: { email: string; password: string; name?: string },
		) => {
			const { email, password, name } = args;

			// Validate email
			if (!validateEmail(email)) {
				throw new Error("Invalid email format");
			}

			// Validate password
			const passwordValidation = validatePassword(password);
			if (!passwordValidation.valid) {
				throw new Error(passwordValidation.error || "Invalid password");
			}

			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email: email.trim().toLowerCase() },
			});

			if (existingUser) {
				// Don't leak that user exists - use generic error
				throw new Error("Invalid email or password");
			}

			// Hash password
			const hashedPassword = await hashPassword(password);

			// Create user
			const user = await prisma.user.create({
				data: {
					email: email.trim().toLowerCase(),
					password: hashedPassword,
					name: name?.trim() || null,
				},
			});

			// Generate token
			const token = generateToken(user.id);

			return {
				token,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					createdAt: user.createdAt.toISOString(),
					updatedAt: user.updatedAt.toISOString(),
				},
			};
		},

		login: async (_: unknown, args: { email: string; password: string }) => {
			const { email, password } = args;

			// Validate email
			if (!validateEmail(email)) {
				throw new Error("Invalid email format");
			}

			// Find user
			const user = await prisma.user.findUnique({
				where: { email: email.trim().toLowerCase() },
			});

			// Don't leak whether user exists - use generic error
			if (!user) {
				throw new Error("Invalid email or password");
			}

			// Verify password
			const isValidPassword = await verifyPassword(user.password, password);
			if (!isValidPassword) {
				throw new Error("Invalid email or password");
			}

			// Generate token
			const token = generateToken(user.id);

			return {
				token,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					createdAt: user.createdAt.toISOString(),
					updatedAt: user.updatedAt.toISOString(),
				},
			};
		},
	},
};

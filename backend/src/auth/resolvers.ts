import { PrismaClient } from "@prisma/client";
import {
	generateToken,
	hashPassword,
	validateEmail,
	validatePassword,
	verifyPassword,
} from "./index";

// PrismaClient should be passed in or imported from a shared instance
// For now, creating here but ideally should be dependency injected
const prisma = new PrismaClient();

export interface AuthContext {
	userId?: number;
}

export const authResolvers = {
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

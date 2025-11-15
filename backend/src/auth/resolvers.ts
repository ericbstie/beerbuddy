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
					nickname: true,
					bio: true,
					profilePicture: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			
			const usersWithCounts = await Promise.all(
				users.map(async (user) => {
					const [followerCount, followingCount, totalPostsCount, totalBeersResult] = await Promise.all([
						prisma.follow.count({
							where: { followingId: user.id },
						}),
						prisma.follow.count({
							where: { followerId: user.id },
						}),
						prisma.post.count({
							where: { authorId: user.id },
						}),
						prisma.post.aggregate({
							where: { authorId: user.id },
							_sum: { beersCount: true },
						}),
					]);
					return {
						...user,
						followerCount,
						followingCount,
						totalPostsCount,
						totalBeersCount: totalBeersResult._sum.beersCount || 0,
						createdAt: user.createdAt.toISOString(),
						updatedAt: user.updatedAt.toISOString(),
					};
				}),
			);
			
			return usersWithCounts;
		},
		user: async (_: unknown, { id }: { id: number }) => {
			const user = await prisma.user.findUnique({
				where: { id },
				select: {
					id: true,
					email: true,
					name: true,
					nickname: true,
					bio: true,
					profilePicture: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			if (!user) {
				return null;
			}

			const [followerCount, followingCount, totalPostsCount, totalBeersResult] = await Promise.all([
				prisma.follow.count({
					where: { followingId: id },
				}),
				prisma.follow.count({
					where: { followerId: id },
				}),
				prisma.post.count({
					where: { authorId: id },
				}),
				prisma.post.aggregate({
					where: { authorId: id },
					_sum: { beersCount: true },
				}),
			]);

			return {
				...user,
				followerCount,
				followingCount,
				totalPostsCount,
				totalBeersCount: totalBeersResult._sum.beersCount || 0,
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
					nickname: true,
					bio: true,
					profilePicture: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!user) {
				throw new Error("User not found");
			}

			const [followerCount, followingCount, totalPostsCount, totalBeersResult] = await Promise.all([
				prisma.follow.count({
					where: { followingId: context.userId },
				}),
				prisma.follow.count({
					where: { followerId: context.userId },
				}),
				prisma.post.count({
					where: { authorId: context.userId },
				}),
				prisma.post.aggregate({
					where: { authorId: context.userId },
					_sum: { beersCount: true },
				}),
			]);

			return {
				...user,
				followerCount,
				followingCount,
				totalPostsCount,
				totalBeersCount: totalBeersResult._sum.beersCount || 0,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			};
		},
	},
	Mutation: {
		signup: async (
			_: unknown,
			args: { email: string; password: string; name?: string; nickname?: string },
		) => {
			const { email, password, name, nickname } = args;

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
					nickname: nickname?.trim() || null,
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
					nickname: user.nickname,
					bio: user.bio,
					profilePicture: user.profilePicture,
					followerCount: 0,
					followingCount: 0,
					totalPostsCount: 0,
					totalBeersCount: 0,
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

			const [followerCount, followingCount, totalPostsCount, totalBeersResult] = await Promise.all([
				prisma.follow.count({
					where: { followingId: user.id },
				}),
				prisma.follow.count({
					where: { followerId: user.id },
				}),
				prisma.post.count({
					where: { authorId: user.id },
				}),
				prisma.post.aggregate({
					where: { authorId: user.id },
					_sum: { beersCount: true },
				}),
			]);

			return {
				token,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					nickname: user.nickname,
					bio: user.bio,
					profilePicture: user.profilePicture,
					followerCount,
					followingCount,
					totalPostsCount,
					totalBeersCount: totalBeersResult._sum.beersCount || 0,
					createdAt: user.createdAt.toISOString(),
					updatedAt: user.updatedAt.toISOString(),
				},
			};
		},

		updateProfile: async (
			_: unknown,
			args: { nickname?: string; bio?: string; profilePicture?: string },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const { nickname, bio, profilePicture } = args;

			// Validate bio length (max 500 characters)
			if (bio !== undefined && bio !== null) {
				if (bio.length > 500) {
					throw new Error("Bio must be 500 characters or less");
				}
			}

			// Validate nickname length (max 50 characters)
			if (nickname !== undefined && nickname !== null) {
				if (nickname.length > 50) {
					throw new Error("Nickname must be 50 characters or less");
				}
			}

			// Build update data object, only including fields that are provided
			const updateData: {
				nickname?: string | null;
				bio?: string | null;
				profilePicture?: string | null;
			} = {};

			if (nickname !== undefined) {
				updateData.nickname = nickname?.trim() || null;
			}
			if (bio !== undefined) {
				updateData.bio = bio?.trim() || null;
			}
			if (profilePicture !== undefined) {
				updateData.profilePicture = profilePicture?.trim() || null;
			}

			const updatedUser = await prisma.user.update({
				where: { id: context.userId },
				data: updateData,
				select: {
					id: true,
					email: true,
					name: true,
					nickname: true,
					bio: true,
					profilePicture: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			const [followerCount, followingCount, totalPostsCount, totalBeersResult] = await Promise.all([
				prisma.follow.count({
					where: { followingId: context.userId },
				}),
				prisma.follow.count({
					where: { followerId: context.userId },
				}),
				prisma.post.count({
					where: { authorId: context.userId },
				}),
				prisma.post.aggregate({
					where: { authorId: context.userId },
					_sum: { beersCount: true },
				}),
			]);

			return {
				...updatedUser,
				followerCount,
				followingCount,
				totalPostsCount,
				totalBeersCount: totalBeersResult._sum.beersCount || 0,
				createdAt: updatedUser.createdAt.toISOString(),
				updatedAt: updatedUser.updatedAt.toISOString(),
			};
		},
	},
};

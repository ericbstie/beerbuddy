import { prisma } from "../db";
import { type AuthContext } from "../auth/resolvers";

// Helper function to add follower/following counts to user object
async function addUserCounts(user: {
	id: number;
	email: string;
	name: string | null;
	nickname: string | null;
	bio: string | null;
	profilePicture: string | null;
	createdAt: Date;
	updatedAt: Date;
}) {
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
}

export const followResolvers = {
	Query: {
		follows: async (
			_: unknown,
			args: { userId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const follows = await prisma.follow.findMany({
				where: {
					followerId: args.userId,
				},
				include: {
					follower: {
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
					},
					following: {
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
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			const followsWithCounts = await Promise.all(
				follows.map(async (follow) => {
					const followerWithCounts = await addUserCounts(follow.follower);
					const followingWithCounts = await addUserCounts(follow.following);
					return {
						...follow,
						follower: followerWithCounts,
						following: followingWithCounts,
						createdAt: follow.createdAt.toISOString(),
					};
				}),
			);

			return {
				follows: followsWithCounts,
				totalCount: follows.length,
			};
		},

		followers: async (
			_: unknown,
			args: { userId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const follows = await prisma.follow.findMany({
				where: {
					followingId: args.userId,
				},
				include: {
					follower: {
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
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			const followersWithCounts = await Promise.all(
				follows.map(async (follow) => addUserCounts(follow.follower)),
			);

			return {
				followers: followersWithCounts,
				totalCount: follows.length,
			};
		},

		following: async (
			_: unknown,
			args: { userId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const follows = await prisma.follow.findMany({
				where: {
					followerId: args.userId,
				},
				include: {
					following: {
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
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			const followingWithCounts = await Promise.all(
				follows.map(async (follow) => addUserCounts(follow.following)),
			);

			return {
				following: followingWithCounts,
				totalCount: follows.length,
			};
		},

		isFollowing: async (
			_: unknown,
			args: { followerId: number; followingId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const follow = await prisma.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: args.followerId,
						followingId: args.followingId,
					},
				},
			});

			return !!follow;
		},
	},

	Mutation: {
		followUser: async (
			_: unknown,
			args: { userId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const userId = args.userId;

			// Can't follow yourself
			if (context.userId === userId) {
				throw new Error("Cannot follow yourself");
			}

			// Check if user exists
			const userToFollow = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!userToFollow) {
				throw new Error("User not found");
			}

			// Check if already following
			const existingFollow = await prisma.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: context.userId,
						followingId: userId,
					},
				},
			});

			if (existingFollow) {
				throw new Error("Already following this user");
			}

			// Create follow relationship
			await prisma.follow.create({
				data: {
					followerId: context.userId,
					followingId: userId,
				},
			});

			return true;
		},

		unfollowUser: async (
			_: unknown,
			args: { userId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const userId = args.userId;

			// Check if following
			const follow = await prisma.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: context.userId,
						followingId: userId,
					},
				},
			});

			if (!follow) {
				throw new Error("Not following this user");
			}

			// Delete follow relationship
			await prisma.follow.delete({
				where: {
					id: follow.id,
				},
			});

			return true;
		},
	},
};


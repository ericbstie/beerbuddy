import { prisma } from "../db";
import { type AuthContext } from "../auth/resolvers";

// Helper function to generate picsum image URL (portrait: 500x700)
function getPicsumImageUrl(seed?: number): string {
	const imageId = seed || Math.floor(Math.random() * 1000);
	return `https://picsum.photos/500/700?random=${imageId}`;
}

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

export const postResolvers = {
	Query: {
		posts: async (
			_: unknown,
			args: { limit?: number; cursor?: number; feed?: boolean },
			context: AuthContext,
		) => {
			const limit = args.limit || 10;
			const cursor = args.cursor;
			const feed = args.feed || false;

			// Build where clause
			const where: {
				id?: { lt: number };
				authorId?: { in: number[] };
			} = {};

			// If feed is true, filter by followed users
			if (feed) {
				if (!context.userId) {
					throw new Error("Not authenticated");
				}

				// Get list of user IDs that the current user follows
				const follows = await prisma.follow.findMany({
					where: {
						followerId: context.userId,
					},
					select: {
						followingId: true,
					},
				});

				const followingIds = follows.map((f) => f.followingId);

				// If user follows no one, return empty result
				if (followingIds.length === 0) {
					return {
						posts: [],
						hasMore: false,
						cursor: null,
					};
				}

				where.authorId = { in: followingIds };
			}

			// Add cursor filter if provided
			if (cursor) {
				where.id = { lt: cursor };
			}

			const posts = await prisma.post.findMany({
				where,
				include: {
					author: {
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
					likes: true,
				},
				orderBy: {
					id: "desc",
				},
				take: limit + 1,
			});

			const hasMore = posts.length > limit;
			const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
			const nextCursor = hasMore
				? postsToReturn[postsToReturn.length - 1]?.id
				: null;

			const userId = context.userId;

			const postsWithCounts = await Promise.all(
				postsToReturn.map(async (post) => {
					const isLiked = userId
						? post.likes.some((like) => like.userId === userId)
						: false;

					const authorWithCounts = await addUserCounts(post.author);

					return {
						...post,
						likesCount: post.likes.length,
						isLiked,
						author: authorWithCounts,
						comments: [], // Comments are fetched separately when needed
						createdAt: post.createdAt.toISOString(),
						updatedAt: post.updatedAt.toISOString(),
					};
				}),
			);

			return {
				posts: postsWithCounts,
				hasMore,
				cursor: nextCursor,
			};
		},

		postComments: async (
			_: unknown,
			args: { postId: number },
			context: AuthContext,
		) => {
			const { postId } = args;

			// Check if post exists
			const post = await prisma.post.findUnique({
				where: { id: postId },
			});

			if (!post) {
				throw new Error("Post not found");
			}

			const comments = await prisma.comment.findMany({
				where: { postId },
				include: {
					user: {
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
					createdAt: "asc",
				},
			});

			const commentsWithCounts = await Promise.all(
				comments.map(async (comment) => {
					const userWithCounts = await addUserCounts(comment.user);
					return {
						...comment,
						user: userWithCounts,
						createdAt: comment.createdAt.toISOString(),
						updatedAt: comment.updatedAt.toISOString(),
					};
				}),
			);

			return {
				postId,
				comments: commentsWithCounts,
			};
		},
	},
	Mutation: {
		createPost: async (
			_: unknown,
			args: {
				title: string;
				description?: string;
				beersCount: number;
				imageUrl: string;
			},
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			// Validate title
			if (!args.title.trim()) {
				throw new Error("Title is required");
			}

			// Validate imageUrl
			if (!args.imageUrl?.trim()) {
				throw new Error("Image URL is required");
			}

			// Validate beersCount - must be between 1 and 12
			if (!Number.isInteger(args.beersCount)) {
				throw new Error("Beer count must be a whole number");
			}
			if (args.beersCount < 1 || args.beersCount > 12) {
				throw new Error("Beer count must be between 1 and 12");
			}

			const imageUrl = args.imageUrl.trim();

			const post = await prisma.post.create({
				data: {
					title: args.title.trim(),
					description: args.description?.trim() || null,
					beersCount: args.beersCount,
					imageUrl,
					authorId: context.userId,
				},
				include: {
					author: {
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
					likes: true,
				},
			});

			const authorWithCounts = await addUserCounts(post.author);

			return {
				...post,
				likesCount: post.likes.length,
				isLiked: false, // New post, user hasn't liked it yet
				author: authorWithCounts,
				comments: [], // Comments are fetched separately when needed
				createdAt: post.createdAt.toISOString(),
				updatedAt: post.updatedAt.toISOString(),
			};
		},

		deletePost: async (
			_: unknown,
			args: { id: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			// Check if post exists and belongs to the user
			const post = await prisma.post.findUnique({
				where: { id: args.id },
			});

			if (!post) {
				throw new Error("Post not found");
			}

			if (post.authorId !== context.userId) {
				throw new Error("You can only delete your own posts");
			}

			await prisma.post.delete({
				where: { id: args.id },
			});

			return true;
		},

		toggleLike: async (
			_: unknown,
			args: { postId: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const { postId } = args;

			// Check if post exists
			const post = await prisma.post.findUnique({
				where: { id: postId },
			});

			if (!post) {
				throw new Error("Post not found");
			}

			// Check if user already liked the post
			const existingLike = await prisma.like.findUnique({
				where: {
					userId_postId: {
						userId: context.userId,
						postId: postId,
					},
				},
			});

			if (existingLike) {
				// Unlike
				await prisma.like.delete({
					where: {
						id: existingLike.id,
					},
				});
			} else {
				// Like
				await prisma.like.create({
					data: {
						userId: context.userId,
						postId: postId,
					},
				});
			}

			// Fetch updated post with likes
			const updatedPost = await prisma.post.findUnique({
				where: { id: postId },
				include: {
					author: {
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
					likes: true,
				},
			});

			if (!updatedPost) {
				throw new Error("Post not found");
			}

			const isLiked = updatedPost.likes.some(
				(like) => like.userId === context.userId,
			);

			const authorWithCounts = await addUserCounts(updatedPost.author);

			return {
				...updatedPost,
				likesCount: updatedPost.likes.length,
				isLiked,
				author: authorWithCounts,
				comments: [], // Comments are fetched separately when needed
				createdAt: updatedPost.createdAt.toISOString(),
				updatedAt: updatedPost.updatedAt.toISOString(),
			};
		},

		createComment: async (
			_: unknown,
			args: { postId: number; text: string },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			const { postId, text } = args;

			// Validate text
			if (!text.trim()) {
				throw new Error("Comment text is required");
			}

			if (text.length > 500) {
				throw new Error("Comment must be 500 characters or less");
			}

			// Check if post exists
			const post = await prisma.post.findUnique({
				where: { id: postId },
			});

			if (!post) {
				throw new Error("Post not found");
			}

			const comment = await prisma.comment.create({
				data: {
					text: text.trim(),
					userId: context.userId,
					postId: postId,
				},
				include: {
					user: {
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
			});

			const userWithCounts = await addUserCounts(comment.user);

			return {
				...comment,
				user: userWithCounts,
				createdAt: comment.createdAt.toISOString(),
				updatedAt: comment.updatedAt.toISOString(),
			};
		},

		deleteComment: async (
			_: unknown,
			args: { id: number },
			context: AuthContext,
		) => {
			if (!context.userId) {
				throw new Error("Not authenticated");
			}

			// Check if comment exists and belongs to the user
			const comment = await prisma.comment.findUnique({
				where: { id: args.id },
			});

			if (!comment) {
				throw new Error("Comment not found");
			}

			if (comment.userId !== context.userId) {
				throw new Error("You can only delete your own comments");
			}

			await prisma.comment.delete({
				where: { id: args.id },
			});

			return true;
		},
	},
};


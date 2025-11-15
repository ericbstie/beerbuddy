import { prisma } from "../db";
import { type AuthContext } from "../auth/resolvers";

// Helper function to generate picsum image URL (portrait: 500x700)
function getPicsumImageUrl(seed?: number): string {
	const imageId = seed || Math.floor(Math.random() * 1000);
	return `https://picsum.photos/500/700?random=${imageId}`;
}

export const postResolvers = {
	Query: {
		posts: async (
			_: unknown,
			args: { limit?: number; cursor?: number },
			context: AuthContext,
		) => {
			const limit = args.limit || 10;
			const cursor = args.cursor;

			const where = cursor
				? {
						id: {
							lt: cursor,
						},
					}
				: {};

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

			return {
				posts: postsToReturn.map((post) => {
					const isLiked = userId
						? post.likes.some((like) => like.userId === userId)
						: false;

					return {
						...post,
						likesCount: post.likes.length,
						isLiked,
						author: {
							...post.author,
							createdAt: post.author.createdAt.toISOString(),
							updatedAt: post.author.updatedAt.toISOString(),
						},
						comments: [], // Comments are fetched separately when needed
						createdAt: post.createdAt.toISOString(),
						updatedAt: post.updatedAt.toISOString(),
					};
				}),
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

			return {
				postId,
				comments: comments.map((comment) => ({
					...comment,
					user: {
						...comment.user,
						createdAt: comment.user.createdAt.toISOString(),
						updatedAt: comment.user.updatedAt.toISOString(),
					},
					createdAt: comment.createdAt.toISOString(),
					updatedAt: comment.updatedAt.toISOString(),
				})),
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
				imageUrl?: string;
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

			// Validate beersCount
			if (args.beersCount < 0) {
				throw new Error("Beers count cannot be negative");
			}

			// Always use picsum for images (portrait: 500x700)
			const imageUrl = args.imageUrl?.trim() || getPicsumImageUrl();

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

			return {
				...post,
				likesCount: post.likes.length,
				isLiked: false, // New post, user hasn't liked it yet
				author: {
					...post.author,
					createdAt: post.author.createdAt.toISOString(),
					updatedAt: post.author.updatedAt.toISOString(),
				},
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

			return {
				...updatedPost,
				likesCount: updatedPost.likes.length,
				isLiked,
				author: {
					...updatedPost.author,
					createdAt: updatedPost.author.createdAt.toISOString(),
					updatedAt: updatedPost.author.updatedAt.toISOString(),
				},
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

			return {
				...comment,
				user: {
					...comment.user,
					createdAt: comment.user.createdAt.toISOString(),
					updatedAt: comment.user.updatedAt.toISOString(),
				},
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


const API_URL =
	(typeof import.meta !== "undefined" && import.meta.env?.BUN_PUBLIC_API_URL) ||
	(typeof process !== "undefined" && process.env?.BUN_PUBLIC_API_URL) ||
	"http://localhost:8000/graphql";

interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{ message: string; path?: string[] }>;
}

export async function graphqlRequest<T>(
	query: string,
	variables?: Record<string, unknown>,
	token?: string,
): Promise<GraphQLResponse<T>> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	let response: Response;
	try {
		response = await fetch(API_URL, {
			method: "POST",
			headers,
			body: JSON.stringify({ query, variables }),
		});
	} catch (error) {
		// Network error (e.g., CORS, connection refused)
		const message =
			error instanceof Error
				? error.message
				: "Network error. Please check your connection.";
		throw new Error(message);
	}

	if (!response.ok) {
		const statusText = response.statusText || `HTTP ${response.status}`;
		throw new Error(`Request failed: ${statusText}`);
	}

	const result = await response.json();

	// GraphQL errors are returned in the response, not as HTTP errors
	// These will be handled by the calling code
	return result;
}

// Auth mutations
export const SIGNUP_MUTATION = `
	mutation Signup($email: String!, $password: String!, $name: String, $nickname: String) {
		signup(email: $email, password: $password, name: $name, nickname: $nickname) {
			token
			user {
				id
				email
				name
				nickname
				bio
				profilePicture
			}
		}
	}
`;

export const LOGIN_MUTATION = `
	mutation Login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			token
			user {
				id
				email
				name
				nickname
				bio
				profilePicture
			}
		}
	}
`;

export const ME_QUERY = `
	query Me {
		me {
			id
			email
			name
			nickname
			bio
			profilePicture
			createdAt
			updatedAt
		}
	}
`;

export const PROFILE_QUERY = `
	query Profile($id: Int!) {
		user(id: $id) {
			id
			email
			name
			nickname
			bio
			profilePicture
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_PROFILE_MUTATION = `
	mutation UpdateProfile($nickname: String, $bio: String, $profilePicture: String) {
		updateProfile(nickname: $nickname, bio: $bio, profilePicture: $profilePicture) {
			id
			email
			name
			nickname
			bio
			profilePicture
			createdAt
			updatedAt
		}
	}
`;

interface User {
	id: number;
	email: string;
	name: string | null;
	nickname: string | null;
	bio: string | null;
	profilePicture: string | null;
	createdAt?: string;
	updatedAt?: string;
}

interface AuthPayload {
	token: string;
	user: User;
}

export interface SignupResponse {
	signup: AuthPayload;
}

export interface LoginResponse {
	login: AuthPayload;
}

export interface MeResponse {
	me: User & {
		createdAt: string;
		updatedAt: string;
	};
}

export interface ProfileResponse {
	user: User & {
		createdAt: string;
		updatedAt: string;
	} | null;
}

export interface UpdateProfileResponse {
	updateProfile: User & {
		createdAt: string;
		updatedAt: string;
	};
}

export const POSTS_QUERY = `
	query Posts($limit: Int, $cursor: Int) {
		posts(limit: $limit, cursor: $cursor) {
			posts {
				id
				title
				description
				beersCount
				imageUrl
				authorId
				likesCount
				isLiked
				author {
					id
					email
					name
					nickname
					bio
					profilePicture
					createdAt
					updatedAt
				}
				createdAt
				updatedAt
			}
			hasMore
			cursor
		}
	}
`;

export const POST_COMMENTS_QUERY = `
	query PostComments($postId: Int!) {
		postComments(postId: $postId) {
			postId
			comments {
				id
				text
				userId
				postId
				user {
					id
					email
					name
					nickname
					bio
					profilePicture
					createdAt
					updatedAt
				}
				createdAt
				updatedAt
			}
		}
	}
`;

export interface Comment {
	id: number;
	text: string;
	userId: number;
	postId: number;
	user: User & {
		createdAt: string;
		updatedAt: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface Post {
	id: number;
	title: string;
	description: string | null;
	beersCount: number;
	imageUrl: string;
	authorId: number;
	likesCount: number;
	isLiked: boolean;
	comments: Comment[];
	author: User & {
		createdAt: string;
		updatedAt: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface PostsConnection {
	posts: Post[];
	hasMore: boolean;
	cursor: number | null;
}

export interface PostsResponse {
	posts: PostsConnection;
}

export interface PostCommentsResponse {
	postComments: {
		postId: number;
		comments: Comment[];
	};
}

export const CREATE_POST_MUTATION = `
	mutation CreatePost($title: String!, $description: String, $beersCount: Int!, $imageUrl: String!) {
		createPost(title: $title, description: $description, beersCount: $beersCount, imageUrl: $imageUrl) {
			id
			title
			description
			beersCount
			imageUrl
			authorId
			author {
				id
				email
				name
				nickname
				bio
				profilePicture
				createdAt
				updatedAt
			}
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_POST_MUTATION = `
	mutation DeletePost($id: Int!) {
		deletePost(id: $id)
	}
`;

export const TOGGLE_LIKE_MUTATION = `
	mutation ToggleLike($postId: Int!) {
		toggleLike(postId: $postId) {
			id
			likesCount
			isLiked
		}
	}
`;

export const CREATE_COMMENT_MUTATION = `
	mutation CreateComment($postId: Int!, $text: String!) {
		createComment(postId: $postId, text: $text) {
			id
			text
			userId
			postId
			user {
				id
				email
				name
				nickname
				bio
				profilePicture
				createdAt
				updatedAt
			}
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_COMMENT_MUTATION = `
	mutation DeleteComment($id: Int!) {
		deleteComment(id: $id)
	}
`;

export interface CreatePostResponse {
	createPost: Post;
}

export interface DeletePostResponse {
	deletePost: boolean;
}

export interface ToggleLikeResponse {
	toggleLike: {
		id: number;
		likesCount: number;
		isLiked: boolean;
	};
}

export interface CreateCommentResponse {
	createComment: Comment;
}

export interface DeleteCommentResponse {
	deleteComment: boolean;
}

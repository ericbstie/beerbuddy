import {
	queryOptions,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { getToken, setToken } from "./auth";
import {
	graphqlRequest,
	CREATE_POST_MUTATION,
	type CreatePostResponse,
	DELETE_POST_MUTATION,
	type DeletePostResponse,
	TOGGLE_LIKE_MUTATION,
	type ToggleLikeResponse,
	CREATE_COMMENT_MUTATION,
	type CreateCommentResponse,
	DELETE_COMMENT_MUTATION,
	type DeleteCommentResponse,
	type Comment,
	LOGIN_MUTATION,
	type LoginResponse,
	ME_QUERY,
	type MeResponse,
	POSTS_QUERY,
	type PostsResponse,
	POST_COMMENTS_QUERY,
	type PostCommentsResponse,
	PROFILE_QUERY,
	type ProfileResponse,
	SIGNUP_MUTATION,
	type SignupResponse,
	UPDATE_PROFILE_MUTATION,
	type UpdateProfileResponse,
} from "./graphql";

// Query keys
export const queryKeys = {
	me: ["me"] as const,
	profile: (userId: number) => ["profile", userId] as const,
	posts: ["posts"] as const,
	postComments: (postId: number) => ["postComments", postId] as const,
};

// Shared query function for me query
async function fetchMe() {
	const token = getToken();
	if (!token) {
		throw new Error("Not authenticated");
	}

	const response = await graphqlRequest<MeResponse>(ME_QUERY, undefined, token);

	if (response.errors) {
		throw new Error(response.errors[0]?.message || "Failed to fetch user data");
	}

	if (!response.data?.me) {
		throw new Error("No user data received");
	}

	return response.data.me;
}

// Query options for use in loaders
export const meQueryOptions = queryOptions({
	queryKey: queryKeys.me,
	queryFn: fetchMe,
});

// Me query hook
export function useMe() {
	return useQuery<MeResponse["me"]>({
		...meQueryOptions,
		enabled: !!getToken(),
		retry: false,
	});
}

// Login mutation
export function useLogin() {
	const queryClient = useQueryClient();

	return useMutation<
		LoginResponse["login"],
		Error,
		{ email: string; password: string }
	>({
		mutationFn: async ({ email, password }) => {
			const response = await graphqlRequest<LoginResponse>(LOGIN_MUTATION, {
				email,
				password,
			});

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Invalid email or password",
				);
			}

			if (!response.data?.login.token) {
				throw new Error("No token received");
			}

			// Store token
			setToken(response.data.login.token);

			return response.data.login;
		},
		onSuccess: () => {
			// Invalidate and refetch user data after successful login
			queryClient.invalidateQueries({ queryKey: queryKeys.me });
		},
	});
}

// Signup mutation
export function useSignup() {
	const queryClient = useQueryClient();

	return useMutation<
		SignupResponse["signup"],
		Error,
		{ email: string; password: string; name?: string; nickname?: string }
	>({
		mutationFn: async ({ email, password, name, nickname }) => {
			const response = await graphqlRequest<SignupResponse>(SIGNUP_MUTATION, {
				email,
				password,
				name,
				nickname,
			});

			if (response.errors) {
				throw new Error(response.errors[0]?.message || "Signup failed");
			}

			if (!response.data?.signup.token) {
				throw new Error("No token received");
			}

			// Store token
			setToken(response.data.signup.token);

			return response.data.signup;
		},
		onSuccess: () => {
			// Invalidate and refetch user data after successful signup
			queryClient.invalidateQueries({ queryKey: queryKeys.me });
		},
	});
}

// Profile query hook
export function useProfile(userId: number) {
	const token = getToken();

	return useQuery<ProfileResponse["user"]>({
		queryKey: queryKeys.profile(userId),
		queryFn: async () => {
			const response = await graphqlRequest<ProfileResponse>(
				PROFILE_QUERY,
				{ id: userId },
				token || undefined,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to fetch profile",
				);
			}

			if (!response.data?.user) {
				throw new Error("Profile not found");
			}

			return response.data.user;
		},
		enabled: !!userId,
		retry: false,
	});
}

// Update profile mutation
export function useUpdateProfile() {
	const queryClient = useQueryClient();
	const token = getToken();

	return useMutation<
		UpdateProfileResponse["updateProfile"],
		Error,
		{ nickname?: string; bio?: string; profilePicture?: string }
	>({
		mutationFn: async ({ nickname, bio, profilePicture }) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			const response = await graphqlRequest<UpdateProfileResponse>(
				UPDATE_PROFILE_MUTATION,
				{ nickname, bio, profilePicture },
				token,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to update profile",
				);
			}

			if (!response.data?.updateProfile) {
				throw new Error("No profile data received");
			}

			return response.data.updateProfile;
		},
		onSuccess: (data) => {
			// Invalidate and refetch user data after successful update
			queryClient.invalidateQueries({ queryKey: queryKeys.me });
			queryClient.invalidateQueries({ queryKey: queryKeys.profile(data.id) });
		},
	});
}

// Posts infinite query hook
export function usePosts() {
	const token = getToken();
	const limit = 10;

	return useInfiniteQuery<PostsResponse["posts"]>({
		queryKey: queryKeys.posts,
		queryFn: async ({ pageParam }) => {
			const response = await graphqlRequest<PostsResponse>(
				POSTS_QUERY,
				{
					limit,
					cursor: pageParam,
				},
				token || undefined,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to fetch posts",
				);
			}

			if (!response.data?.posts) {
				throw new Error("No posts data received");
			}

			return response.data.posts;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.hasMore ? lastPage.cursor : undefined;
		},
		retry: false,
	});
}

// Post comments query hook
export function usePostComments(postId: number) {
	const token = getToken();

	return useQuery<PostCommentsResponse["postComments"]["comments"]>({
		queryKey: queryKeys.postComments(postId),
		queryFn: async () => {
			const response = await graphqlRequest<PostCommentsResponse>(
				POST_COMMENTS_QUERY,
				{ postId },
				token || undefined,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to fetch comments",
				);
			}

			if (!response.data?.postComments) {
				throw new Error("No comments data received");
			}

			return response.data.postComments.comments;
		},
		enabled: !!postId && !!token,
		retry: false,
	});
}

// Create post mutation
export function useCreatePost() {
	const queryClient = useQueryClient();
	const token = getToken();

	return useMutation<
		CreatePostResponse["createPost"],
		Error,
		{ title: string; description?: string; beersCount: number; imageUrl?: string }
	>({
		mutationFn: async ({ title, description, beersCount, imageUrl }) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			const response = await graphqlRequest<CreatePostResponse>(
				CREATE_POST_MUTATION,
				{ title, description, beersCount, imageUrl },
				token,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to create post",
				);
			}

			if (!response.data?.createPost) {
				throw new Error("No post data received");
			}

			return response.data.createPost;
		},
		onSuccess: () => {
			// Invalidate and refetch posts after successful creation
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

// Delete post mutation
export function useDeletePost() {
	const queryClient = useQueryClient();
	const token = getToken();

	return useMutation<boolean, Error, { id: number }>({
		mutationFn: async ({ id }) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			const response = await graphqlRequest<DeletePostResponse>(
				DELETE_POST_MUTATION,
				{ id },
				token,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to delete post",
				);
			}

			return response.data?.deletePost ?? false;
		},
		onSuccess: () => {
			// Invalidate and refetch posts after successful deletion
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

// Toggle like mutation
export function useToggleLike() {
	const queryClient = useQueryClient();
	const token = getToken();

	return useMutation<
		ToggleLikeResponse["toggleLike"],
		Error,
		{ postId: number }
	>({
		mutationFn: async ({ postId }) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			const response = await graphqlRequest<ToggleLikeResponse>(
				TOGGLE_LIKE_MUTATION,
				{ postId },
				token,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to toggle like",
				);
			}

			if (!response.data?.toggleLike) {
				throw new Error("No response received");
			}

			return response.data.toggleLike;
		},
		onSuccess: () => {
			// Invalidate and refetch posts after successful like toggle
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

// Create comment mutation
export function useCreateComment() {
	const queryClient = useQueryClient();
	const token = getToken();

	return useMutation<Comment, Error, { postId: number; text: string }>({
		mutationFn: async ({ postId, text }) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			const response = await graphqlRequest<CreateCommentResponse>(
				CREATE_COMMENT_MUTATION,
				{ postId, text },
				token,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to create comment",
				);
			}

			if (!response.data?.createComment) {
				throw new Error("No comment data received");
			}

			return response.data.createComment;
		},
		onSuccess: (data, variables) => {
			// Invalidate comments for this specific post
			queryClient.invalidateQueries({ queryKey: queryKeys.postComments(variables.postId) });
			// Note: We don't invalidate posts query here to avoid remounting all PostCards
			// which would reset their showComments state. Comment count updates aren't critical.
		},
	});
}

// Delete comment mutation
export function useDeleteComment() {
	const queryClient = useQueryClient();
	const token = getToken();

	return useMutation<boolean, Error, { id: number }>({
		mutationFn: async ({ id }) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			const response = await graphqlRequest<DeleteCommentResponse>(
				DELETE_COMMENT_MUTATION,
				{ id },
				token,
			);

			if (response.errors) {
				throw new Error(
					response.errors[0]?.message || "Failed to delete comment",
				);
			}

			return response.data?.deleteComment ?? false;
		},
		onSuccess: () => {
			// Invalidate and refetch posts after successful comment deletion
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

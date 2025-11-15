import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { getToken, setToken } from "./auth";
import {
	graphqlRequest,
	LOGIN_MUTATION,
	type LoginResponse,
	ME_QUERY,
	type MeResponse,
	SIGNUP_MUTATION,
	type SignupResponse,
} from "./graphql";

// Query keys
export const queryKeys = {
	me: ["me"] as const,
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
		{ email: string; password: string; name?: string }
	>({
		mutationFn: async ({ email, password, name }) => {
			const response = await graphqlRequest<SignupResponse>(SIGNUP_MUTATION, {
				email,
				password,
				name,
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

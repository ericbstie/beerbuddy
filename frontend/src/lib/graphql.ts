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
	mutation Signup($email: String!, $password: String!, $name: String) {
		signup(email: $email, password: $password, name: $name) {
			token
			user {
				id
				email
				name
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
			createdAt
		}
	}
`;

interface AuthPayload {
	token: string;
	user: {
		id: number;
		email: string;
		name: string | null;
	};
}

export interface SignupResponse {
	signup: AuthPayload;
}

export interface LoginResponse {
	login: AuthPayload;
}

export interface MeResponse {
	me: {
		id: number;
		email: string;
		name: string | null;
		createdAt: string;
	};
}

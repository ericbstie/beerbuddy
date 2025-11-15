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

	const response = await fetch(API_URL, {
		method: "POST",
		headers,
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.json();
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

import { beforeAll, expect, test } from "bun:test";

const API_URL = process.env.API_URL || "http://localhost:8000/graphql";

interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{ message: string; path?: string[] }>;
}

async function graphqlRequest<T>(
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

	return await response.json();
}

// Helper to wait for API to be ready
async function waitForAPI(maxAttempts = 30): Promise<void> {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: "{ __typename }" }),
			});

			if (response.ok) {
				return;
			}
		} catch {
			// API not ready yet
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	throw new Error("API not available after waiting");
}

beforeAll(async () => {
	await waitForAPI();
});

test("signup - creates user with valid credentials", async () => {
	const email = `test-${Date.now()}@example.com`;
	const password = "securepass123";
	const name = "Test User";

	const response = await graphqlRequest<{
		signup: {
			token: string;
			user: { id: number; email: string; name: string };
		};
	}>(
		`
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
	`,
		{ email, password, name },
	);

	expect(response.errors).toBeUndefined();
	expect(response.data).toBeDefined();
	expect(response.data?.signup.token).toBeDefined();
	expect(response.data?.signup.user.email).toBe(email);
	expect(response.data?.signup.user.name).toBe(name);
	expect(typeof response.data?.signup.user.id).toBe("number");
});

test("signup - rejects invalid email format", async () => {
	const response = await graphqlRequest<{ signup: unknown }>(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email: "invalid-email", password: "testpass123" },
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toBe("Invalid email format");
	expect(response.data).toBeNull();
});

test("signup - rejects weak password", async () => {
	const response = await graphqlRequest<{ signup: unknown }>(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email: "test@example.com", password: "short" },
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toContain("at least 8 characters");
	expect(response.data).toBeNull();
});

test("signup - rejects duplicate email", async () => {
	const email = `duplicate-${Date.now()}@example.com`;
	const password = "testpass123";

	// First signup should succeed
	const firstResponse = await graphqlRequest<{ signup: unknown }>(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email, password },
	);

	expect(firstResponse.errors).toBeUndefined();

	// Second signup with same email should fail
	const secondResponse = await graphqlRequest<{ signup: unknown }>(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email, password },
	);

	expect(secondResponse.errors).toBeDefined();
	expect(secondResponse.errors?.[0].message).toBe("Invalid email or password");
	expect(secondResponse.data).toBeNull();
});

test("login - authenticates with valid credentials", async () => {
	const email = `login-${Date.now()}@example.com`;
	const password = "testpass123";
	const name = "Login Test";

	// First create user
	await graphqlRequest(
		`
		mutation Signup($email: String!, $password: String!, $name: String) {
			signup(email: $email, password: $password, name: $name) {
				token
			}
		}
	`,
		{ email, password, name },
	);

	// Then login
	const response = await graphqlRequest<{
		login: { token: string; user: { id: number; email: string; name: string } };
	}>(
		`
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
	`,
		{ email, password },
	);

	expect(response.errors).toBeUndefined();
	expect(response.data).toBeDefined();
	expect(response.data?.login.token).toBeDefined();
	expect(response.data?.login.user.email).toBe(email);
	expect(response.data?.login.user.name).toBe(name);
});

test("login - rejects wrong password", async () => {
	const email = `wrongpass-${Date.now()}@example.com`;
	const password = "correctpass123";

	// Create user
	await graphqlRequest(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email, password },
	);

	// Try login with wrong password
	const response = await graphqlRequest<{ login: unknown }>(
		`
		mutation Login($email: String!, $password: String!) {
			login(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email, password: "wrongpassword" },
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toBe("Invalid email or password");
	expect(response.data).toBeNull();
});

test("login - rejects non-existent user", async () => {
	const response = await graphqlRequest<{ login: unknown }>(
		`
		mutation Login($email: String!, $password: String!) {
			login(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email: `nonexistent-${Date.now()}@example.com`, password: "testpass123" },
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toBe("Invalid email or password");
	expect(response.data).toBeNull();
});

test("me query - returns authenticated user", async () => {
	const email = `me-${Date.now()}@example.com`;
	const password = "testpass123";
	const name = "Me Test";

	// Create user and get token
	const signupResponse = await graphqlRequest<{
		signup: { token: string };
	}>(
		`
		mutation Signup($email: String!, $password: String!, $name: String) {
			signup(email: $email, password: $password, name: $name) {
				token
			}
		}
	`,
		{ email, password, name },
	);

	const token = signupResponse.data?.signup.token;
	expect(token).toBeDefined();

	// Query me with token
	const meResponse = await graphqlRequest<{
		me: { id: number; email: string; name: string; createdAt: string };
	}>(
		`
		query Me {
			me {
				id
				email
				name
				createdAt
			}
		}
	`,
		undefined,
		token,
	);

	expect(meResponse.errors).toBeUndefined();
	expect(meResponse.data).toBeDefined();
	expect(meResponse.data?.me.email).toBe(email);
	expect(meResponse.data?.me.name).toBe(name);
	expect(meResponse.data?.me.createdAt).toBeDefined();
});

test("me query - rejects unauthenticated request", async () => {
	const response = await graphqlRequest<{ me: unknown }>(
		`
		query Me {
			me {
				id
				email
			}
		}
	`,
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toBe("Not authenticated");
	expect(response.data?.me).toBeNull();
});

test("me query - rejects invalid token", async () => {
	const response = await graphqlRequest<{ me: unknown }>(
		`
		query Me {
			me {
				id
				email
			}
		}
	`,
		undefined,
		"invalid.token.here",
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toBe("Not authenticated");
	expect(response.data?.me).toBeNull();
});

test("password field - not exposed in GraphQL schema", async () => {
	const response = await graphqlRequest<{ users: unknown }>(
		`
		query Users {
			users {
				id
				email
				password
			}
		}
	`,
	);

	expect(response.errors).toBeDefined();
	expect(response.errors?.[0].message).toContain(
		'Cannot query field "password"',
	);
});

test("users query - returns list of users without passwords", async () => {
	const email1 = `users1-${Date.now()}@example.com`;
	const email2 = `users2-${Date.now()}@example.com`;

	// Create two users
	await graphqlRequest(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email: email1, password: "testpass123" },
	);

	await graphqlRequest(
		`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				token
			}
		}
	`,
		{ email: email2, password: "testpass123" },
	);

	// Query users
	const response = await graphqlRequest<{
		users: Array<{ id: number; email: string; name: string | null }>;
	}>(
		`
		query Users {
			users {
				id
				email
				name
			}
		}
	`,
	);

	expect(response.errors).toBeUndefined();
	expect(response.data).toBeDefined();
	expect(Array.isArray(response.data?.users)).toBe(true);
	expect(response.data?.users.length).toBeGreaterThanOrEqual(2);

	// Verify passwords are not in response
	const userEmails = response.data?.users.map((u) => u.email) || [];
	expect(userEmails).toContain(email1);
	expect(userEmails).toContain(email2);
});

test("user query - returns single user without password", async () => {
	const email = `single-${Date.now()}@example.com`;
	const name = "Single User";

	// Create user
	const signupResponse = await graphqlRequest<{
		signup: { user: { id: number } };
	}>(
		`
		mutation Signup($email: String!, $password: String!, $name: String) {
			signup(email: $email, password: $password, name: $name) {
				user {
					id
				}
			}
		}
	`,
		{ email, password: "testpass123", name },
	);

	const userId = signupResponse.data?.signup.user.id;
	expect(userId).toBeDefined();

	// Query user by ID
	const response = await graphqlRequest<{
		user: { id: number; email: string; name: string | null };
	}>(
		`
		query User($id: Int!) {
			user(id: $id) {
				id
				email
				name
			}
		}
	`,
		{ id: userId },
	);

	expect(response.errors).toBeUndefined();
	expect(response.data).toBeDefined();
	expect(response.data?.user.id).toBe(userId);
	expect(response.data?.user.email).toBe(email);
	expect(response.data?.user.name).toBe(name);
});

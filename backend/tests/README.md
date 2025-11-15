# Backend Tests

## Integration Tests

Integration tests verify the authentication system end-to-end by making actual HTTP requests to the GraphQL API.

### Prerequisites

1. Start the backend and database services:
   ```bash
   docker-compose up -d
   ```

2. Wait for services to be ready (the tests will wait automatically, but you can verify):
   ```bash
   docker-compose ps
   ```

### Running Tests

Run all integration tests:
```bash
bun test:integration
```

Or run with a custom API URL:
```bash
API_URL=http://localhost:8000/graphql bun test:integration
```

Run all tests (including unit tests if added):
```bash
bun test
```

### Test Coverage

The integration tests cover:

- ✅ User signup with valid credentials
- ✅ Signup validation (email format, password strength)
- ✅ Duplicate email prevention
- ✅ User login with valid credentials
- ✅ Login with wrong password
- ✅ Login with non-existent user
- ✅ Authenticated queries (`me`)
- ✅ Unauthenticated query rejection
- ✅ Invalid token rejection
- ✅ Password field security (not exposed in GraphQL)
- ✅ User listing and retrieval

### Test Structure

Tests are located in `tests/integration/` and use Bun's built-in test framework (`bun:test`).

Each test:
- Makes real HTTP requests to the GraphQL API
- Verifies both success and error cases
- Ensures security best practices are followed
- Uses unique email addresses to avoid conflicts


import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	// Use schema file from backend (more reliable than introspection)
	schema: "../backend/src/auth/schema.graphql",
	documents: ["src/**/*.{ts,tsx}", "src/**/*.graphql"],
	generates: {
		"src/lib/generated/graphql.ts": {
			plugins: [
				"typescript",
				"typescript-operations",
				"typescript-react-query",
			],
			config: {
				useTypeImports: true,
				skipTypename: true,
				exposeQueryKeys: true,
				exposeFetcher: true,
			},
		},
	},
	hooks: {
		afterAllFileWrite: ["bunx @biomejs/biome format --write"],
	},
};

export default config;

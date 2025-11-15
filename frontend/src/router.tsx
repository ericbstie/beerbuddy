import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { rootRoute } from "./routes/__root";
import { HomeRoute } from "./routes/home";
import { IndexRoute } from "./routes/index";
import { LoginRoute } from "./routes/login";
import { SignupRoute } from "./routes/signup";

const queryClient = new QueryClient();

const routeTree = rootRoute.addChildren([
	IndexRoute,
	LoginRoute,
	SignupRoute,
	HomeRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export function Router() {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}

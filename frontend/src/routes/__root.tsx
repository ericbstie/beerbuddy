import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const rootRoute = createRootRoute({
	component: () => (
		<>
			<Outlet />
			{import.meta.env.DEV && <TanStackRouterDevtools />}
		</>
	),
});

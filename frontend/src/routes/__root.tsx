import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "sonner";

export const rootRoute = createRootRoute({
	component: () => (
		<>
			<Outlet />
			<Toaster position="bottom-right" richColors />
			{process.env.NODE_ENV !== "production" && <TanStackRouterDevtools />}
		</>
	),
});

import { createRoute, Navigate } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const IndexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: () => <Navigate to="/login" />,
});

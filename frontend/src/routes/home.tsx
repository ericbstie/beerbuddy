import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const HomeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/home",
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-foreground mb-4">Home</h1>
				<p className="text-muted-foreground">
					Welcome to BeerBuddy! This is your home page.
				</p>
			</div>
		</div>
	);
}

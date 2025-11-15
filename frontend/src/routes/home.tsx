import { useQueryClient } from "@tanstack/react-query";
import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { useMe } from "@/lib/queries";
import { rootRoute } from "./__root";

export const HomeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/home",
	component: HomePage,
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function HomePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: user, isLoading } = useMe();

	const handleLogout = () => {
		removeToken();
		// Clear query cache on logout
		queryClient.clear();
		navigate({ to: "/login" });
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold text-foreground">Home</h1>
					<Button onClick={handleLogout} variant="outline">
						Logout
					</Button>
				</div>
				{isLoading ? (
					<p className="text-muted-foreground text-lg">Loading...</p>
				) : (
					<div>
						<p className="text-muted-foreground text-lg">
							Welcome to BeerBuddy{user?.name ? `, ${user.name}` : ""}! This is
							your home page.
						</p>
						{user && (
							<div className="mt-4 text-sm text-muted-foreground">
								<p>Email: {user.email}</p>
								{user.name && <p>Name: {user.name}</p>}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

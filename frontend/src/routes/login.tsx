import { createRoute, Link } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { rootRoute } from "./__root";

export const LoginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	component: LoginPage,
});

function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">BeerBuddy</h1>
					<p className="text-muted-foreground">Sign in to your account</p>
				</div>
				<LoginForm />
				<div className="mt-6 text-center text-sm text-muted-foreground">
					Don't have an account?{" "}
					<Link
						to="/signup"
						className="text-primary hover:underline font-medium"
					>
						Sign up
					</Link>
				</div>
			</div>
		</div>
	);
}

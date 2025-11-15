import { createRoute, Link } from "@tanstack/react-router";
import { SignupForm } from "@/components/auth/SignupForm";
import { rootRoute } from "./__root";

export const SignupRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/signup",
	component: SignupPage,
});

function SignupPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">BeerBuddy</h1>
					<p className="text-muted-foreground">Create your account</p>
				</div>
				<SignupForm />
				<div className="mt-6 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						to="/login"
						className="text-primary hover:underline font-medium"
					>
						Sign in
					</Link>
				</div>
			</div>
		</div>
	);
}

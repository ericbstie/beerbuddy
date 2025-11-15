import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
	const navigate = useNavigate();

	const form = useForm<LoginFormValues>({
		defaultValues: {
			email: "",
			password: "",
		},
		validatorAdapter: zodValidator(),
		onSubmit: async ({ value }) => {
			// Form validation passed - in a real app, this would call an API
			console.log("Login form submitted:", value);
			// Navigate to home page after "login"
			navigate({ to: "/home" });
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sign In</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field
						name="email"
						validators={{
							onChange: zodValidator(loginSchema.shape.email),
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Email</Label>
								<Input
									id={field.name}
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-sm text-destructive">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field
						name="password"
						validators={{
							onChange: zodValidator(loginSchema.shape.password),
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-sm text-destructive">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<Button
						type="submit"
						className="w-full"
						disabled={form.state.isSubmitting}
					>
						{form.state.isSubmitting ? "Signing in..." : "Sign In"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

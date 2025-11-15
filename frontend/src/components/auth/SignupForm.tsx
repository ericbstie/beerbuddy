import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signupSchema = z
	.object({
		email: z.string().email("Please enter a valid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
	const navigate = useNavigate();

	const form = useForm<SignupFormValues>({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
		validatorAdapter: zodValidator(),
		onSubmit: async ({ value }) => {
			// Form validation passed - in a real app, this would call an API
			console.log("Signup form submitted:", value);
			// Navigate to home page after "signup"
			navigate({ to: "/home" });
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Account</CardTitle>
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
							onChange: zodValidator(signupSchema.shape.email),
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
							onChange: zodValidator(signupSchema.shape.password),
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

					<form.Field
						name="confirmPassword"
						validators={{
							onChange: zodValidator(signupSchema),
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Confirm Password</Label>
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
						{form.state.isSubmitting ? "Creating..." : "Sign Up"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/lib/queries";

const signupBaseSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	confirmPassword: z.string(),
});

const signupSchema = signupBaseSchema.refine(
	(data) => data.password === data.confirmPassword,
	{
		message: "Passwords do not match",
		path: ["confirmPassword"],
	},
);

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
	const navigate = useNavigate();
	const signupMutation = useSignup();

	const form = useForm<SignupFormValues>({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
		validatorAdapter: zodValidator(),
		onSubmit: async ({ value }) => {
			try {
				await signupMutation.mutateAsync({
					email: value.email,
					password: value.password,
				});
				navigate({ to: "/home" });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "An error occurred";
				form.setFieldMeta("email", (prev) => ({
					...prev,
					errors: [message],
				}));
			}
		},
	});

	return (
		<Card className="shadow-lg w-full">
			<CardHeader
				className="pt-0"
				style={{ paddingBottom: "clamp(1rem, 3vw, 1.5rem)" }}
			>
				<CardTitle
					style={{
						fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
					}}
				>
					Create Account
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					style={{ gap: "clamp(1rem, 3vw, 1.25rem)" }}
					className="flex flex-col"
				>
					<form.Field
						name="email"
						validators={{
							onChange: signupBaseSchema.shape.email,
						}}
					>
						{(field) => (
							<div style={{ gap: "0.5rem" }} className="flex flex-col">
								<Label htmlFor={field.name}>Email</Label>
								<Input
									id={field.name}
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{(() => {
									// Filter out any non-string errors (like validator objects)
									const stringErrors = field.state.meta.errors
										.filter((e) => typeof e === "string" && e !== "")
										.map((e) => String(e)) as string[];
									if (stringErrors.length === 0) return null;
									const errorMessage = stringErrors[0];
									if (!errorMessage || typeof errorMessage !== "string")
										return null;
									return (
										<p className="text-sm text-destructive">{errorMessage}</p>
									);
								})()}
							</div>
						)}
					</form.Field>

					<form.Field
						name="password"
						validators={{
							onChange: signupBaseSchema.shape.password,
						}}
					>
						{(field) => (
							<div style={{ gap: "0.5rem" }} className="flex flex-col">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										// Re-validate confirmPassword when password changes
										form.validateField("confirmPassword", "change");
									}}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{(() => {
									// Filter out any non-string errors (like validator objects)
									const stringErrors = field.state.meta.errors
										.filter((e) => typeof e === "string" && e !== "")
										.map((e) => String(e)) as string[];
									if (stringErrors.length === 0) return null;
									const errorMessage = stringErrors[0];
									if (!errorMessage || typeof errorMessage !== "string")
										return null;
									return (
										<p className="text-sm text-destructive">{errorMessage}</p>
									);
								})()}
							</div>
						)}
					</form.Field>

					<form.Field
						name="confirmPassword"
						validators={{
							onChange: ({ value }) => {
								const password = form.state.values.password;
								if (!password) {
									// Don't validate if password is empty
									return undefined;
								}
								if (value !== password) {
									return "Passwords do not match";
								}
								return undefined;
							},
							onBlur: ({ value }) => {
								const password = form.state.values.password;
								if (value !== password) {
									return "Passwords do not match";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div style={{ gap: "0.5rem" }} className="flex flex-col">
								<Label htmlFor={field.name}>Confirm Password</Label>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								{(() => {
									// Filter out any non-string errors (like validator objects)
									const stringErrors = field.state.meta.errors
										.filter((e) => typeof e === "string" && e !== "")
										.map((e) => String(e)) as string[];
									if (stringErrors.length === 0) return null;
									const errorMessage = stringErrors[0];
									if (!errorMessage || typeof errorMessage !== "string")
										return null;
									return (
										<p className="text-sm text-destructive">{errorMessage}</p>
									);
								})()}
							</div>
						)}
					</form.Field>

					<Button
						type="submit"
						className="w-full"
						disabled={form.state.isSubmitting || signupMutation.isPending}
					>
						{form.state.isSubmitting || signupMutation.isPending
							? "Creating..."
							: "Sign Up"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

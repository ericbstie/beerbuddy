/**
 * Email validation - basic format check.
 * Email service verification is not required per requirements.
 */
export function validateEmail(email: string): boolean {
	if (!email || typeof email !== "string") {
		return false;
	}

	// Basic email format validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Password validation - enforce minimum security requirements.
 */
export function validatePassword(password: string): {
	valid: boolean;
	error?: string;
} {
	if (!password || typeof password !== "string") {
		return { valid: false, error: "Password is required" };
	}

	if (password.length < 8) {
		return {
			valid: false,
			error: "Password must be at least 8 characters long",
		};
	}

	return { valid: true };
}

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

export interface JWTPayload {
	userId: number;
}

/**
 * Generate a JWT token for a user.
 * Token contains only the user ID (minimal payload).
 */
export function generateToken(userId: number): string {
	const payload: JWTPayload = { userId };
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
	});
}

/**
 * Verify and decode a JWT token.
 * Returns the payload if valid, null otherwise.
 */
export function verifyToken(token: string): JWTPayload | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
		return decoded;
	} catch {
		return null;
	}
}

/**
 * Extract JWT token from Authorization header.
 * Supports "Bearer <token>" format.
 */
export function extractTokenFromHeader(
	authHeader: string | undefined,
): string | null {
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") {
		return null;
	}

	return parts[1];
}

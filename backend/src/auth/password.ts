import argon2 from "argon2";

/**
 * Hash a password using Argon2id.
 * Uses recommended parameters: memory 65536 KB, time cost 3, parallelism 4.
 */
export async function hashPassword(password: string): Promise<string> {
	return await argon2.hash(password, {
		type: argon2.argon2id,
		memoryCost: 65536, // 64 MB
		timeCost: 3,
		parallelism: 4,
	});
}

/**
 * Verify a password against an Argon2 hash.
 */
export async function verifyPassword(
	hash: string,
	password: string,
): Promise<boolean> {
	try {
		return await argon2.verify(hash, password);
	} catch {
		return false;
	}
}

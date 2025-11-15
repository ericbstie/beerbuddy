import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient instance
// In production, consider connection pooling and proper lifecycle management
export const prisma = new PrismaClient();

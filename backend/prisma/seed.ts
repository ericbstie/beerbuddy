import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth/password";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting database seed...");

	// Find or create a test user
	let user = await prisma.user.findUnique({
		where: { email: "test@example.com" },
	});

	if (!user) {
		console.log("Creating test user...");
		const hashedPassword = await hashPassword("Test123!@#");
		user = await prisma.user.create({
			data: {
				email: "test@example.com",
				password: hashedPassword,
				name: "Test User",
				nickname: "BeerLover",
				bio: "Love trying new beers!",
			},
		});
		console.log(`Created user: ${user.email} (ID: ${user.id})`);
	} else {
		console.log(`Using existing user: ${user.email} (ID: ${user.id})`);
	}

	// Delete existing posts for this user (optional - comment out if you want to keep them)
	const deleteCount = await prisma.post.deleteMany({
		where: { authorId: user.id },
	});
	console.log(`Deleted ${deleteCount.count} existing posts`);

	// Create 50 posts with picsum images (portrait: 500x700)
	console.log("Creating 50 posts...");
	const posts = [];
	for (let i = 0; i < 50; i++) {
		// Use different image IDs for variety, all portrait 500x700
		const imageId = 100 + i;
		posts.push({
			title: "Great Beer Night",
			description: "Had an amazing time at the local pub with friends! 🍺",
			beersCount: Math.floor(Math.random() * 10) + 1, // Random 1-10 beers
			imageUrl: `https://picsum.photos/500/700?random=${imageId}`,
			authorId: user.id,
		});
	}

	await prisma.post.createMany({
		data: posts,
	});

	console.log(`✅ Successfully created 50 posts for user ${user.email}`);
	console.log("Seed completed!");
}

main()
	.catch((e) => {
		console.error("Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


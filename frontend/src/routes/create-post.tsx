import { useState } from "react";
import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { useCreatePost } from "@/lib/queries";
import { toast } from "@/lib/toast";
import { rootRoute } from "./__root";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";

export const CreatePostRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/create-post",
	component: CreatePostPage,
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function CreatePostPage() {
	const navigate = useNavigate();
	const createPost = useCreatePost();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [beersCount, setBeersCount] = useState("1");
	const [imageUrl, setImageUrl] = useState("");

	const handleCreatePost = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate imageUrl is provided
		if (!imageUrl.trim()) {
			toast.error("Please provide an image URL");
			return;
		}

		// Validate beer count is between 1 and 12
		const beers = parseInt(beersCount, 10);
		if (isNaN(beers) || beers < 1 || beers > 12) {
			toast.error("Beer count must be between 1 and 12");
			return;
		}

		try {
			await createPost.mutateAsync({
				title,
				description: description || undefined,
				beersCount: beers,
				imageUrl: imageUrl.trim(),
			});
			toast.success("Post created successfully!");
			navigate({ to: "/home" });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create post",
			);
		}
	};

	return (
		<div className="h-screen bg-background flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-1 overflow-y-auto pt-4">
				<div className="container mx-auto px-4 py-8 max-w-2xl">
					<Button
						variant="ghost"
						onClick={() => navigate({ to: "/home" })}
						className="mb-6"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Home
					</Button>
					<Card>
						<CardHeader>
							<CardTitle>Create New Post</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleCreatePost} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="title">Title *</Label>
									<Input
										id="title"
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Post title"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="What happened tonight?"
										rows={6}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="imageUrl">Image URL *</Label>
									<Input
										id="imageUrl"
										type="url"
										value={imageUrl}
										onChange={(e) => setImageUrl(e.target.value)}
										placeholder="https://example.com/image.jpg"
										required
									/>
									<p className="text-xs text-muted-foreground">
										Enter a URL to an image for your post
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="beersCount">Beers Count *</Label>
									<Input
										id="beersCount"
										type="number"
										min="1"
										max="12"
										step="1"
										value={beersCount}
										onChange={(e) => {
											const value = e.target.value;
											// Only allow integers between 1 and 12
											if (value === "" || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 12)) {
												setBeersCount(value);
											}
										}}
										required
									/>
									<p className="text-xs text-muted-foreground">
										Must be between 1 and 12 (whole numbers only)
									</p>
								</div>

								<div className="flex gap-2 pt-4">
									<Button
										type="submit"
										disabled={createPost.isPending}
										isLoading={createPost.isPending}
									>
										Create Post
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => navigate({ to: "/home" })}
										disabled={createPost.isPending}
									>
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}


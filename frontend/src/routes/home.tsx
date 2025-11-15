import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { useMe, usePosts, useCreatePost, useDeletePost, useToggleLike, useCreateComment, useDeleteComment, usePostComments } from "@/lib/queries";
import { toast } from "@/lib/toast";
import { rootRoute } from "./__root";
import { MoreVertical, Beer, Trash2, Clock, Heart, MessageCircle, Send, Loader2, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const HomeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/home",
	component: HomePage,
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function HomePage() {
	const queryClient = useQueryClient();
	const { data: user, isLoading } = useMe();
	const {
		data: postsData,
		isLoading: postsLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePosts();
	const createPost = useCreatePost();
	const deletePost = useDeletePost();
	const toggleLike = useToggleLike();
	const createComment = useCreateComment();
	const deleteComment = useDeleteComment();

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [beersCount, setBeersCount] = useState("0");
	const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null);
	const [isDesktop, setIsDesktop] = useState(false);

	// Detect desktop vs mobile
	useEffect(() => {
		const checkDesktop = () => {
			setIsDesktop(window.innerWidth >= 768); // md breakpoint
		};
		checkDesktop();
		window.addEventListener("resize", checkDesktop);
		return () => window.removeEventListener("resize", checkDesktop);
	}, []);

	// Flatten all posts from all pages
	const allPosts = useMemo(() => {
		return postsData?.pages.flatMap((page) => page.posts) ?? [];
	}, [postsData]);

	// Virtual scrolling setup
	const parentRef = useRef<HTMLDivElement>(null);
	const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);
	
	// Update viewport height on resize
	useEffect(() => {
		const updateViewportHeight = () => {
			setViewportHeight(window.innerHeight);
		};
		
		window.addEventListener("resize", updateViewportHeight);
		return () => {
			window.removeEventListener("resize", updateViewportHeight);
		};
	}, []);
	
	// Card dimensions: 4:3 portrait aspect ratio for images, min-height 70% of screen, can expand up to full screen
	const cardMinHeight = viewportHeight * 0.7;
	const cardMaxHeight = viewportHeight;
	const cardWidth = cardMinHeight * (3 / 4); // 4:3 portrait aspect ratio (height:width = 4:3, so width:height = 3:4)
	const GAP_SIZE = 32; // gap-8 = 2rem = 32px
	
	const virtualizer = useVirtualizer({
		count: allPosts.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => cardMinHeight + GAP_SIZE,
		overscan: 5, // Render 5 extra items outside the viewport
		measureElement: (element) => {
			return element?.getBoundingClientRect().height ?? cardMinHeight + GAP_SIZE;
		},
	});

	// Load more when scrolling near the end
	const checkLoadMore = useCallback(() => {
		const virtualItems = virtualizer.getVirtualItems();
		if (virtualItems.length === 0) return;

		const lastItem = virtualItems[virtualItems.length - 1];
		if (
			lastItem &&
			lastItem.index >= allPosts.length - 3 &&
			hasNextPage &&
			!isFetchingNextPage
		) {
			fetchNextPage();
		}
	}, [virtualizer, allPosts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

	// Watch for virtual items changes to trigger load more
	useEffect(() => {
		checkLoadMore();
	}, [checkLoadMore]);


	const handleCreatePost = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createPost.mutateAsync({
				title,
				description: description || undefined,
				beersCount: parseInt(beersCount, 10),
			});
			toast.success("Post created successfully!");
			setTitle("");
			setDescription("");
			setBeersCount("0");
			setShowCreateForm(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create post",
			);
		}
	};

	const handleDeletePost = async (id: number) => {
		if (!confirm("Are you sure you want to delete this post?")) {
			return;
		}
		try {
			await deletePost.mutateAsync({ id });
			toast.success("Post deleted successfully!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete post",
			);
		}
	};

	// Helper function to format time ago
	function getTimeAgo(date: Date): string {
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
		if (seconds < 60) return "just now";
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		const weeks = Math.floor(days / 7);
		if (weeks < 4) return `${weeks}w ago`;
		const months = Math.floor(days / 30);
		if (months < 12) return `${months}mo ago`;
		const years = Math.floor(days / 365);
		return `${years}y ago`;
	}

	// Post card component
	function PostCard({
		post,
		currentUser,
		virtualItem,
		onDelete,
		isDeleting,
		getTimeAgo,
		cardMinHeight,
		cardMaxHeight,
		cardWidth,
		onOpenComments,
	}: {
		post: (typeof allPosts)[0];
		currentUser: (typeof user)["data"];
		virtualItem: ReturnType<typeof virtualizer.getVirtualItems>[0];
		onDelete: (id: number) => void;
		isDeleting: boolean;
		getTimeAgo: (date: Date) => string;
		cardMinHeight: number;
		cardMaxHeight: number;
		cardWidth: number;
		onOpenComments: (postId: number) => void;
	}) {
		const [showDeleteMenu, setShowDeleteMenu] = useState(false);
		const menuRef = useRef<HTMLDivElement>(null);
		const cardRef = useRef<HTMLDivElement>(null);

		// Measure card height for virtualizer
		useEffect(() => {
			if (cardRef.current && virtualItem) {
				const height = cardRef.current.getBoundingClientRect().height;
				if (height !== virtualItem.size) {
					virtualizer.measureElement(cardRef.current);
				}
			}
		}, [virtualItem, virtualizer]);
		const authorName =
			post.author.nickname ||
			post.author.name ||
			post.author.email.split("@")[0] ||
			"Unknown";
		const timeAgo = getTimeAgo(new Date(post.createdAt));

		const handleToggleLike = async () => {
			try {
				await toggleLike.mutateAsync({ postId: post.id });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to toggle like",
				);
			}
		};

		// Close menu when clicking outside
		useEffect(() => {
			function handleClickOutside(event: MouseEvent) {
				if (
					menuRef.current &&
					!menuRef.current.contains(event.target as Node)
				) {
					setShowDeleteMenu(false);
				}
			}

			if (showDeleteMenu) {
				document.addEventListener("mousedown", handleClickOutside);
				return () => {
					document.removeEventListener("mousedown", handleClickOutside);
				};
			}
		}, [showDeleteMenu]);

		return (
			<div
				ref={cardRef}
				data-index={virtualItem.index}
				style={{
					width: `${cardWidth}px`,
					minHeight: `${cardMinHeight}px`,
					maxHeight: `${cardMaxHeight}px`,
				}}
			>
				<Card className="bg-card border border-border/50 shadow-md hover:shadow-lg transition-shadow overflow-hidden p-0 gap-0 flex flex-col h-full max-h-full">
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30 flex-shrink-0">
							<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
								{post.author.profilePicture ? (
									<img
										src={post.author.profilePicture}
										alt={authorName}
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-primary text-sm font-bold">
										{authorName.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-bold text-foreground">
									{authorName}
								</span>
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Clock className="w-3.5 h-3.5" />
									<span>{timeAgo}</span>
								</div>
							</div>
						</div>
						{currentUser && post.authorId === currentUser.id && (
							<div className="relative" ref={menuRef}>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setShowDeleteMenu(!showDeleteMenu)}
									className="text-muted-foreground hover:text-foreground"
								>
									<MoreVertical className="w-4 h-4" />
								</Button>
								{showDeleteMenu && (
									<div className="absolute right-0 top-8 z-10 bg-card border border-border rounded-md shadow-lg min-w-[120px]">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowDeleteMenu(false);
												onDelete(post.id);
											}}
											disabled={isDeleting}
											className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Delete
										</Button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Image */}
					<div className="bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden flex items-center justify-center" style={{ aspectRatio: "3/4" }}>
						<img
							src={post.imageUrl}
							alt={post.title}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>

					{/* Content */}
					<CardContent className="px-6 py-5 bg-card flex-shrink-0 overflow-y-auto">
						{/* Actions - Like, Comment buttons, and Beer count */}
						<div className="flex items-center gap-3 mb-4">
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={handleToggleLike}
								disabled={toggleLike.isPending}
								className={`${post.isLiked ? "text-red-500 hover:text-red-600" : "text-foreground hover:text-red-500"} -ml-2 transition-colors`}
							>
								<Heart
									className={`w-6 h-6 transition-transform hover:scale-[1.65] ${post.isLiked ? "fill-current" : ""}`}
									style={{ transform: "scale(1.2)" }}
								/>
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => onOpenComments(post.id)}
								className="text-foreground hover:text-primary -ml-2 transition-colors"
							>
								<MessageCircle 
									className="w-6 h-6 transition-transform hover:scale-[1.65]" 
									style={{ transform: "scale(1.2)" }}
								/>
							</Button>
							<div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary rounded-full text-xs font-semibold border border-primary/20 ml-auto">
								<Beer className="w-4 h-4" />
								<span>
									{post.beersCount} beer{post.beersCount !== 1 ? "s" : ""}
								</span>
							</div>
						</div>

						{/* Likes count */}
						{post.likesCount > 0 && (
							<p className="text-xs font-bold text-foreground mb-3">
								{post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
							</p>
						)}

						{/* Caption */}
						<div className="mb-2">
							{post.title && (
								<h3 className="text-base font-bold text-foreground mb-2">
									{post.title}
								</h3>
							)}
							{post.description && (
								<p className="text-sm text-foreground/90 leading-relaxed">
									{post.description}
								</p>
							)}
						</div>

					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-screen bg-background flex flex-col overflow-hidden">
			<Navbar 
				showCreatePost={showCreateForm}
				onCreatePostClick={() => setShowCreateForm(!showCreateForm)}
			/>

			<div className="flex-1 flex flex-col min-h-0 relative">
				{showCreateForm && (
					<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-lg px-4">
						<Card className="mb-6">
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
											rows={3}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="beersCount">Beers Count *</Label>
										<Input
											id="beersCount"
											type="number"
											min="0"
											value={beersCount}
											onChange={(e) => setBeersCount(e.target.value)}
											required
										/>
									</div>

									<Button
										type="submit"
										disabled={createPost.isPending}
										isLoading={createPost.isPending}
									>
										Create Post
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				)}

				{postsLoading && allPosts.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-muted-foreground">Loading posts...</p>
					</div>
				) : allPosts.length > 0 ? (
					<div
						ref={parentRef}
						className={`flex-1 overflow-y-auto overflow-x-hidden w-full h-full transition-transform duration-300 ${
							openCommentsPostId && isDesktop ? "-translate-x-[400px]" : ""
						}`}
						onScroll={checkLoadMore}
					>
						<div className="grid grid-cols-1 gap-8 justify-items-center px-4 py-4" style={{ aspectRatio: "2/3" }}>
							{virtualizer.getVirtualItems().map((virtualItem) => {
								const post = allPosts[virtualItem.index];
								if (!post) return null;
								return (
									<PostCard
										key={post.id}
										post={post}
										currentUser={user?.data}
										virtualItem={virtualItem}
										onDelete={handleDeletePost}
										isDeleting={deletePost.isPending}
										getTimeAgo={getTimeAgo}
										cardMinHeight={cardMinHeight}
										cardMaxHeight={cardMaxHeight}
										cardWidth={cardWidth}
										onOpenComments={setOpenCommentsPostId}
									/>
								);
							})}
						</div>
						{isFetchingNextPage && (
							<div className="text-center py-6 text-muted-foreground text-sm">
								Loading more posts...
							</div>
						)}
						{!hasNextPage && allPosts.length > 0 && (
							<div className="text-center py-6 text-muted-foreground text-sm">
								No more posts to load
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center justify-center h-full">
						<p className="text-muted-foreground">No posts yet. Create one!</p>
					</div>
				)}
			</div>

			{/* Comments Drawer */}
			{openCommentsPostId && (
				<CommentsDrawer
					postId={openCommentsPostId}
					currentUser={user?.data}
					onClose={() => setOpenCommentsPostId(null)}
					getTimeAgo={getTimeAgo}
					createComment={createComment}
					deleteComment={deleteComment}
					isDesktop={isDesktop}
				/>
			)}
		</div>
	);
}

// Comments Drawer Component
function CommentsDrawer({
	postId,
	currentUser,
	onClose,
	getTimeAgo,
	createComment,
	deleteComment,
	isDesktop,
}: {
	postId: number;
	currentUser: { id: number } | null | undefined;
	onClose: () => void;
	getTimeAgo: (date: Date) => string;
	createComment: ReturnType<typeof useCreateComment>;
	deleteComment: ReturnType<typeof useDeleteComment>;
	isDesktop: boolean;
}) {
	const [commentText, setCommentText] = useState("");
	const queryClient = useQueryClient();
	const { data: comments = [], isLoading: commentsLoading } = usePostComments(postId);

	const handleCreateComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!commentText.trim() || createComment.isPending) return;

		const textToSubmit = commentText.trim();
		setCommentText("");

		try {
			await createComment.mutateAsync({
				postId,
				text: textToSubmit,
			});
			toast.success("Comment added successfully!");
		} catch (error) {
			setCommentText(textToSubmit);
			const errorMessage = error instanceof Error ? error.message : "Failed to create comment";
			toast.error(errorMessage);
			console.error("Failed to create comment:", error);
		}
	};

	const handleDeleteComment = async (commentId: number) => {
		if (!confirm("Are you sure you want to delete this comment?")) {
			return;
		}
		try {
			await deleteComment.mutateAsync({ id: commentId });
			queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete comment",
			);
		}
	};

	return (
		<>
			{/* Backdrop - only on mobile */}
			{!isDesktop && (
				<div
					className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
					onClick={onClose}
				/>
			)}
			{/* Drawer */}
			<div
				className={`fixed z-50 bg-card border-border shadow-2xl flex flex-col transition-all duration-300 ${
					isDesktop
						? "top-[73px] right-0 h-[calc(100vh-73px)] w-[400px] border-l rounded-l-2xl animate-in slide-in-from-right"
						: "bottom-0 left-0 right-0 max-h-[80vh] border-t rounded-t-2xl animate-in slide-in-from-bottom"
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
					<h2 className="text-lg font-bold text-foreground">Comments</h2>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="w-5 h-5" />
					</Button>
				</div>

				{/* Comments list */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{commentsLoading ? (
						<p className="text-sm text-muted-foreground text-center py-8">Loading comments...</p>
					) : comments.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No comments yet. Be the first to comment!
						</p>
					) : (
						comments.map((comment) => {
							const commentAuthorName =
								comment.user.nickname ||
								comment.user.name ||
								comment.user.email.split("@")[0] ||
								"Unknown";
							return (
								<div
									key={comment.id}
									className="flex items-start gap-3 group"
								>
									<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
										{comment.user.profilePicture ? (
											<img
												src={comment.user.profilePicture}
												alt={commentAuthorName}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-primary text-xs font-semibold">
												{commentAuthorName.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1">
												<p className="text-sm text-foreground leading-relaxed">
													<span className="font-semibold">
														{commentAuthorName}
													</span>{" "}
													{comment.text}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													{getTimeAgo(new Date(comment.createdAt))}
												</p>
											</div>
											{currentUser && comment.userId === currentUser.id && (
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => handleDeleteComment(comment.id)}
													disabled={deleteComment.isPending}
													className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Comment input */}
				<div className="border-t border-border px-6 py-4 flex-shrink-0">
					<form onSubmit={handleCreateComment} className="flex gap-3">
						<Input
							type="text"
							placeholder="Add a comment..."
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							className="flex-1"
							maxLength={500}
							disabled={createComment.isPending}
						/>
						<Button
							type="submit"
							size="icon-sm"
							disabled={!commentText.trim() || createComment.isPending}
							isLoading={createComment.isPending}
						>
							{createComment.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Send className="w-4 h-4" />
							)}
						</Button>
					</form>
				</div>
			</div>
		</>
	);
}

import { createRoute, redirect, useParams, Link } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import {
	useMe,
	useProfile,
	useFollowers,
	useFollowing,
	useFollowUser,
	useUnfollowUser,
	useIsFollowing,
} from "@/lib/queries";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { rootRoute } from "./__root";

export const ProfileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/profile",
	component: OwnProfilePage,
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

export const ProfileByIdRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/profile/$userId",
	component: ProfileByIdPage,
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
});

function OwnProfilePage() {
	const { data: currentUser } = useMe();
	const userId = currentUser?.id;

	const { data: profile, isLoading, error } = useProfile(userId || 0);

	if (isLoading) {
		return (
			<div className="h-screen bg-background flex flex-col overflow-hidden">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted-foreground text-lg">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="h-screen bg-background flex flex-col overflow-hidden">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-destructive text-lg">
						{error instanceof Error ? error.message : "Failed to load profile"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen bg-background flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-1 overflow-y-auto pt-4">
				<div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
					<ProfileHeader user={profile} isOwnProfile={true} />
					<FollowersAndFollowing userId={userId || 0} />
					{/* ProfilePostsList will be added in Sprint 7 when Post model exists */}
				</div>
			</div>
		</div>
	);
}

function ProfileByIdPage() {
	const params = useParams({ from: "/profile/$userId" });
	const { data: currentUser } = useMe();
	const userId = parseInt(params.userId, 10);

	const { data: profile, isLoading, error } = useProfile(userId);

	const isOwnProfile = currentUser?.id === userId;

	if (isLoading) {
		return (
			<div className="h-screen bg-background flex flex-col overflow-hidden">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted-foreground text-lg">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="h-screen bg-background flex flex-col overflow-hidden">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-destructive text-lg">
						{error instanceof Error ? error.message : "Failed to load profile"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen bg-background flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-1 overflow-y-auto pt-4">
				<div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
					<ProfileHeader user={profile} isOwnProfile={isOwnProfile} />
					<FollowersAndFollowing userId={userId} />
					{/* ProfilePostsList will be added in Sprint 7 when Post model exists */}
				</div>
			</div>
		</div>
	);
}

function UserListItem({
	user,
	currentUserId,
}: {
	user: {
		id: number;
		email: string;
		name: string | null;
		nickname: string | null;
		bio: string | null;
		profilePicture: string | null;
	};
	currentUserId?: number;
}) {
	const displayName = user.nickname || user.name || user.email.split("@")[0];
	const isOwnProfile = currentUserId === user.id;
	const { data: isFollowing = false } = useIsFollowing(
		currentUserId || 0,
		user.id,
	);
	const followUser = useFollowUser();
	const unfollowUser = useUnfollowUser();

	const handleFollow = async () => {
		try {
			await followUser.mutateAsync({ userId: user.id });
			toast.success(`You are now following ${displayName}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to follow user",
			);
		}
	};

	const handleUnfollow = async () => {
		try {
			await unfollowUser.mutateAsync({ userId: user.id });
			toast.success(`You unfollowed ${displayName}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to unfollow user",
			);
		}
	};

	return (
		<div className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors">
			<Link
				to="/profile/$userId"
				params={{ userId: user.id.toString() }}
				className="flex items-center gap-3 flex-1 min-w-0"
			>
				<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
					{user.profilePicture ? (
						<img
							src={user.profilePicture}
							alt={displayName}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-primary text-sm font-bold">
							{displayName.charAt(0).toUpperCase()}
						</span>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-foreground truncate">
						{displayName}
					</p>
					{user.bio && (
						<p className="text-xs text-muted-foreground truncate">{user.bio}</p>
					)}
				</div>
			</Link>
			{!isOwnProfile && currentUserId && (
				<Button
					onClick={(e) => {
						e.preventDefault();
						if (isFollowing) {
							handleUnfollow();
						} else {
							handleFollow();
						}
					}}
					disabled={followUser.isPending || unfollowUser.isPending}
					variant={isFollowing ? "outline" : "default"}
					size="sm"
					className="gap-1.5 flex-shrink-0"
				>
					{followUser.isPending || unfollowUser.isPending ? (
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
					) : isFollowing ? (
						<>
							<UserMinus className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Unfollow</span>
						</>
					) : (
						<>
							<UserPlus className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Follow</span>
						</>
					)}
				</Button>
			)}
		</div>
	);
}

function FollowersAndFollowing({ userId }: { userId: number }) {
	const { data: currentUser } = useMe();
	const { data: followers = [], isLoading: followersLoading } = useFollowers(userId);
	const { data: following = [], isLoading: followingLoading } = useFollowing(userId);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Followers</CardTitle>
				</CardHeader>
				<CardContent>
					{followersLoading ? (
						<p className="text-sm text-muted-foreground">Loading...</p>
					) : followers.length === 0 ? (
						<p className="text-sm text-muted-foreground">No followers yet</p>
					) : (
						<div className="space-y-3">
							{followers.map((user) => (
								<UserListItem
									key={user.id}
									user={user}
									currentUserId={currentUser?.id}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Following</CardTitle>
				</CardHeader>
				<CardContent>
					{followingLoading ? (
						<p className="text-sm text-muted-foreground">Loading...</p>
					) : following.length === 0 ? (
						<p className="text-sm text-muted-foreground">Not following anyone yet</p>
					) : (
						<div className="space-y-3">
							{following.map((user) => (
								<UserListItem
									key={user.id}
									user={user}
									currentUserId={currentUser?.id}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}


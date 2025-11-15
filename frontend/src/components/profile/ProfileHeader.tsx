import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditForm } from "./ProfileEditForm";
import { useMe, useFollowUser, useUnfollowUser, useIsFollowing } from "@/lib/queries";
import { toast } from "@/lib/toast";
import { UserPlus, UserMinus, Loader2, Beer, FileText } from "lucide-react";

interface User {
	id: number;
	email: string;
	name: string | null;
	nickname: string | null;
	bio: string | null;
	profilePicture: string | null;
	followerCount: number;
	followingCount: number;
	totalBeersCount: number;
	totalPostsCount: number;
	createdAt: string;
	updatedAt: string;
}

interface ProfileHeaderProps {
	user: User;
	isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
	const [isEditing, setIsEditing] = useState(false);
	const { data: currentUser } = useMe();
	const followUser = useFollowUser();
	const unfollowUser = useUnfollowUser();
	const { data: isFollowing = false } = useIsFollowing(
		currentUser?.id || 0,
		user.id,
	);

	const displayName = user.nickname || user.name || user.email.split("@")[0];

	const handleEditSuccess = () => {
		setIsEditing(false);
	};

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

	if (isEditing) {
		return (
			<ProfileEditForm
				user={user}
				onSuccess={handleEditSuccess}
				onCancel={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex items-start gap-6">
						<div className="flex-shrink-0">
							{user.profilePicture ? (
								<img
									src={user.profilePicture}
									alt={displayName}
									className="w-24 h-24 rounded-full object-cover border-2 border-border"
								/>
							) : (
								<div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
									<span className="text-2xl font-semibold text-muted-foreground">
										{displayName.charAt(0).toUpperCase()}
									</span>
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-3 mb-1">
								<h1 className="text-2xl font-bold text-foreground">
									{displayName}
								</h1>
								{!isOwnProfile && (
									<Button
										onClick={isFollowing ? handleUnfollow : handleFollow}
										disabled={followUser.isPending || unfollowUser.isPending}
										variant={isFollowing ? "outline" : "default"}
										size="sm"
										className="gap-2"
									>
										{followUser.isPending || unfollowUser.isPending ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : isFollowing ? (
											<>
												<UserMinus className="w-4 h-4" />
												Unfollow
											</>
										) : (
											<>
												<UserPlus className="w-4 h-4" />
												Follow
											</>
										)}
									</Button>
								)}
							</div>
							{user.email && (
								<p className="text-sm text-muted-foreground mb-3">
									{user.email}
								</p>
							)}
							<div className="flex items-center gap-4 mb-3">
								<div className="flex items-center gap-1">
									<span className="font-semibold text-foreground">
										{user.followerCount}
									</span>
									<span className="text-sm text-muted-foreground">
										{user.followerCount === 1 ? "follower" : "followers"}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="font-semibold text-foreground">
										{user.followingCount}
									</span>
									<span className="text-sm text-muted-foreground">following</span>
								</div>
							</div>
							{user.bio ? (
								<p className="text-sm text-foreground whitespace-pre-wrap">
									{user.bio}
								</p>
							) : (
								isOwnProfile && (
									<p className="text-sm text-muted-foreground italic">
										No bio yet. Click Edit Profile to add one.
									</p>
								)
							)}
						</div>
						{isOwnProfile && (
							<div className="flex-shrink-0">
								<Button onClick={() => setIsEditing(true)} variant="outline">
									Edit Profile
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Stats</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
							<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
								<Beer className="w-5 h-5 text-primary" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{user.totalBeersCount}
								</p>
								<p className="text-xs text-muted-foreground">
									{user.totalBeersCount === 1 ? "beer" : "beers"} posted
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
							<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
								<FileText className="w-5 h-5 text-primary" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{user.totalPostsCount}
								</p>
								<p className="text-xs text-muted-foreground">
									{user.totalPostsCount === 1 ? "post" : "posts"}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}


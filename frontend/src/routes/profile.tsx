import { createRoute, redirect, useParams } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useMe, useProfile } from "@/lib/queries";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Navbar } from "@/components/Navbar";
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
				<div className="container mx-auto px-4 py-8 max-w-4xl">
					<ProfileHeader user={profile} isOwnProfile={true} />
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
				<div className="container mx-auto px-4 py-8 max-w-4xl">
					<ProfileHeader user={profile} isOwnProfile={isOwnProfile} />
					{/* ProfilePostsList will be added in Sprint 7 when Post model exists */}
				</div>
			</div>
		</div>
	);
}


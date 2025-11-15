import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileEditForm } from "./ProfileEditForm";

interface User {
	id: number;
	email: string;
	name: string | null;
	nickname: string | null;
	bio: string | null;
	profilePicture: string | null;
	createdAt: string;
	updatedAt: string;
}

interface ProfileHeaderProps {
	user: User;
	isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
	const [isEditing, setIsEditing] = useState(false);

	const displayName = user.nickname || user.name || user.email.split("@")[0];

	const handleEditSuccess = () => {
		setIsEditing(false);
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
						<h1 className="text-2xl font-bold text-foreground mb-1">
							{displayName}
						</h1>
						{user.email && (
							<p className="text-sm text-muted-foreground mb-2">
								{user.email}
							</p>
						)}
						{user.bio ? (
							<p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
								{user.bio}
							</p>
						) : (
							isOwnProfile && (
								<p className="text-sm text-muted-foreground italic mt-2">
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
	);
}


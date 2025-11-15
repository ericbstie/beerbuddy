import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateProfile } from "@/lib/queries";
import { toast } from "@/lib/toast";

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

interface ProfileEditFormProps {
	user: User;
	onSuccess: () => void;
	onCancel: () => void;
}

export function ProfileEditForm({
	user,
	onSuccess,
	onCancel,
}: ProfileEditFormProps) {
	const [nickname, setNickname] = useState(user.nickname || "");
	const [bio, setBio] = useState(user.bio || "");
	const [profilePicture, setProfilePicture] = useState(
		user.profilePicture || "",
	);

	const updateProfile = useUpdateProfile();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate bio length
		if (bio.length > 500) {
			toast.error("Bio must be 500 characters or less");
			return;
		}

		// Validate nickname length
		if (nickname.length > 50) {
			toast.error("Nickname must be 50 characters or less");
			return;
		}

		try {
			await updateProfile.mutateAsync({
				nickname: nickname.trim() || undefined,
				bio: bio.trim() || undefined,
				profilePicture: profilePicture.trim() || undefined,
			});
			toast.success("Profile updated successfully");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update profile",
			);
		}
	};

	const bioLength = bio.length;
	const nicknameLength = nickname.length;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit Profile</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="nickname">Nickname</Label>
						<Input
							id="nickname"
							type="text"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							placeholder="Your display name"
							maxLength={50}
						/>
						<p className="text-xs text-muted-foreground">
							{nicknameLength}/50 characters
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bio">Bio</Label>
						<Textarea
							id="bio"
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Tell us about yourself..."
							rows={4}
							maxLength={500}
						/>
						<p className="text-xs text-muted-foreground">
							{bioLength}/500 characters
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="profilePicture">Profile Picture URL</Label>
						<Input
							id="profilePicture"
							type="url"
							value={profilePicture}
							onChange={(e) => setProfilePicture(e.target.value)}
							placeholder="https://example.com/image.jpg"
						/>
						<p className="text-xs text-muted-foreground">
							Enter a URL to your profile picture. Image upload will be available
							later.
						</p>
					</div>

					<div className="flex gap-2 pt-4">
						<Button
							type="submit"
							disabled={updateProfile.isPending}
							isLoading={updateProfile.isPending}
						>
							Save Changes
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={updateProfile.isPending}
						>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}


import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Beer, User, LogOut } from "lucide-react";
import { removeToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export function Navbar() {
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const location = useLocation();
	
	// Check URL search params to determine active tab
	const urlParams = new URLSearchParams(location.search);
	const feedParam = urlParams.get("feed") === "true";
	const isFeed = location.pathname === "/home" && feedParam;
	const isExplore = location.pathname === "/home" && !feedParam;

	const handleLogout = () => {
		removeToken();
		queryClient.clear();
		navigate({ to: "/login" });
	};

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setShowProfileMenu(false);
			}
		}

		if (showProfileMenu) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [showProfileMenu]);

	return (
		<div className="flex-shrink-0 z-20 bg-primary shadow-lg">
			<div className="bg-primary/95 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-4 max-w-7xl">
					<div className="flex justify-between items-center">
						<Link to="/home" className="flex items-center gap-2 group">
							<div className="w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center border-2 border-primary-foreground/30 group-hover:bg-primary-foreground/30 transition-colors shadow-md">
								<Beer className="w-6 h-6 text-primary-foreground" />
							</div>
							<h1 className="text-2xl font-extrabold text-primary-foreground drop-shadow-lg tracking-tight">
								BeerBuddy
							</h1>
						</Link>
						{location.pathname === "/home" && (
							<div className="flex items-center gap-1 bg-primary-foreground/10 rounded-lg p-1 border border-primary-foreground/20">
								<Link
									to="/home"
									search={{ feed: true }}
									className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
										isFeed
											? "bg-primary-foreground text-primary shadow-sm"
											: "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
									}`}
								>
									Feed
								</Link>
								<Link
									to="/home"
									className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
										isExplore
											? "bg-primary-foreground text-primary shadow-sm"
											: "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
									}`}
								>
									Explore
								</Link>
							</div>
						)}
						<div className="flex gap-3 items-center">
							<Button
								asChild
								variant="default"
								size="sm"
								className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-md hover:shadow-lg transition-all"
							>
								<Link to="/create-post">
									Create Post
								</Link>
							</Button>
							<div className="relative" ref={menuRef}>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowProfileMenu(!showProfileMenu)}
									className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border border-primary-foreground/20 backdrop-blur-sm w-10 h-10 rounded-full"
								>
									<User className="w-5 h-5" />
								</Button>
								{showProfileMenu && (
									<div className="absolute right-0 top-12 z-30 bg-card border border-border rounded-md shadow-lg min-w-[160px] overflow-hidden">
										<Button
											variant="ghost"
											size="sm"
											asChild
											className="w-full justify-start rounded-none"
											onClick={() => setShowProfileMenu(false)}
										>
											<Link to="/profile">
												<User className="w-4 h-4 mr-2" />
												Profile
											</Link>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowProfileMenu(false);
												handleLogout();
											}}
											className="w-full justify-start rounded-none text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<LogOut className="w-4 h-4 mr-2" />
											Logout
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


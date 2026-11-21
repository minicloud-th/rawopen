import { navigateAuth } from "@/lib/auth-navigation";
import { memberPaths } from "@/lib/member-navigation";
import { ProfileDropdown } from "./profile-dropdown";

export default function ProfileDropdownDemo() {
  return <ProfileDropdown user={{ displayName: "OpenCraft", email: null, emailVerified: false, photoURL: "/assets/headphones.jpg" }} secure={false} page="dashboard" onNavigate={page => navigateAuth(memberPaths[page])} onSignOut={() => {}}/>;
}

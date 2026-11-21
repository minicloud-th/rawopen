"use client";

import { useEffect, useState } from "react";
import { CircleUserRound, LogOut, Moon, Settings, ShieldCheck, Store, Sun } from "lucide-react";
import type { MemberIdentity } from "@/lib/member-profile";
import { memberPaths, type MemberPage } from "@/lib/member-navigation";
import { useTheme } from "@/lib/theme";
import AvatarBorder from "./avatar-border";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./dropdown-menu";
import "@/profile-dropdown.css";

interface ProfileDropdownProps {
  user: MemberIdentity;
  secure: boolean;
  sellerApproved?:boolean;
  page: MemberPage;
  busy?: boolean;
  onNavigate: (page: MemberPage) => void;
  onSignOut: () => void;
}

/** The supplied dropdown adapted to OpenCraft's member routes and status avatar. */
export function ProfileDropdown({ user, secure, sellerApproved=false, page, busy, onNavigate, onSignOut }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setOpen(false), [page]);
  const items = [
    { page: "profile" as const, label: "โปรไฟล์ของฉัน", icon: CircleUserRound },
    { page: "seller" as const, label: "ร้านค้าของฉัน", icon: Store },
    { page: "security" as const, label: secure ? "ความปลอดภัย" : "ยืนยันบัญชี", icon: ShieldCheck },
    { page: "settingsGeneral" as const, label: "ตั้งค่าบัญชี", icon: Settings },
  ];
  const status = secure ? "secure" : "pending";
  return <div className="member-profile">
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="member-avatar profile-dropdown-trigger" aria-label="เมนูบัญชีของฉัน">
          <AvatarBorder src={user.photoURL} name={user.displayName || user.email} status={status} size={30}/>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={12} collisionPadding={12} className="profile-dropdown-content" aria-label="เมนูบัญชี">
        <DropdownMenuLabel className="profile-dropdown-identity">
          <AvatarBorder src={user.photoURL} name={user.displayName || user.email} status={status} size={32}/>
          <span><strong>{user.displayName || "สมาชิก OpenCraft"}</strong><span>{user.email || "บัญชี OpenCraft"}</span></span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="profile-dropdown-divider"/>
        {items.filter(item=>sellerApproved || !['profile','seller'].includes(item.page)).map(({ page: destination, label, icon: Icon }) => <DropdownMenuItem key={destination} className="profile-dropdown-item" asChild>
          <a href={memberPaths[destination]} onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); setOpen(false); onNavigate(destination);
          }}><Icon size={17} strokeWidth={1.7}/><span>{label}</span></a>
        </DropdownMenuItem>)}
        <DropdownMenuSeparator className="profile-dropdown-divider"/>
        <DropdownMenuRadioGroup value={theme} onValueChange={value => { if (value === "light" || value === "dark") setTheme(value); }} className="profile-dropdown-theme" aria-label="ธีมเว็บไซต์">
          <DropdownMenuRadioItem value="light" className="profile-dropdown-theme-item" onSelect={event => event.preventDefault()}><Sun size={15}/><span>สว่าง</span></DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="profile-dropdown-theme-item" onSelect={event => event.preventDefault()}><Moon size={15}/><span>มืด</span></DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator className="profile-dropdown-divider"/>
        <DropdownMenuItem className="profile-dropdown-item profile-dropdown-signout" disabled={busy} onSelect={onSignOut}><LogOut size={17} strokeWidth={1.7}/><span>{busy ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}</span></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}

export default ProfileDropdown;

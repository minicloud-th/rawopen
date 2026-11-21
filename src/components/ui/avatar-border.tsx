"use client";
import { Check, CircleAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type AvatarBorderStatus = "pending" | "secure";
export interface AvatarBorderProps {
  src?: string | null;
  name?: string | null;
  status?: AvatarBorderStatus;
  size?: number;
  className?: string;
  indicator?: boolean;
}

export function AvatarBorder({ src, name, status = "pending", size = 38, className, indicator = true }: AvatarBorderProps) {
  const initial = (name?.trim().slice(0, 1) || "O").toLocaleUpperCase("th-TH");
  return <span role="img" aria-label={status === "secure" ? "ยืนยันอีเมลและเปิดการยืนยันสองขั้นตอนแล้ว" : "โปรดยืนยันอีเมลและเปิดการยืนยันสองขั้นตอน"} className={cn("avatar-border", status === "secure" ? "is-secure" : "is-pending", className)} style={{ width: size + 6, height: size + 6 }}>
    <Avatar className="avatar-border-image" style={{ width: size, height: size }}>
      <AvatarImage src={src || undefined} alt="" referrerPolicy="no-referrer" />
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
    {indicator && <span className="avatar-border-indicator" aria-hidden="true">{status === "secure" ? <Check size={11} strokeWidth={2.5}/> : <CircleAlert size={11} strokeWidth={2.3}/>}</span>}
  </span>;
}

export default AvatarBorder;

import AvatarBorder from "@/components/ui/avatar-border";
export default function AvatarBorderDemo() {
  return <div className="flex items-center gap-4"><AvatarBorder src="/assets/headphones.jpg" name="OpenCraft" status="pending"/><AvatarBorder src="/assets/headphones.jpg" name="OpenCraft" status="secure"/></div>;
}

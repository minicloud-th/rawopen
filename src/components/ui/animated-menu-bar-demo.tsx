import { useState } from 'react';
import { MenuBar, type MenuBarKey } from '@/components/ui/animated-menu-bar';
export default function DemoOne() {
  const [active, setActive] = useState<MenuBarKey>('dashboard');
  return <MenuBar active={active} onSelect={setActive}/>;
}

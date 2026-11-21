'use client';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AtSign, Bell, CircleHelp, Ellipsis, Heart, House, Settings, ShieldCheck, ShoppingBag, SquareCheck, Store, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import '@/animated-menu-bar.css';

export type MenuBarKey = 'dashboard' | 'favorites' | 'cart' | 'topup' | 'seller' | 'notifications' | 'settings' | 'help' | 'security';
type MenuBarGroup = readonly [MenuBarKey, ...MenuBarKey[]];

export interface MenuBarProps {
  active?: MenuBarKey | null;
  onSelect?: (key: MenuBarKey) => void;
  labels?: Partial<Record<MenuBarKey, string>>;
  orientation?: 'horizontal' | 'vertical';
  items?: readonly (MenuBarKey | MenuBarGroup)[];
  counts?: Partial<Record<MenuBarKey, number>>;
  hrefs?: Partial<Record<MenuBarKey, string>>;
  className?: string;
  'aria-label'?: string;
}
const menuItems: Record<MenuBarKey, { label: string; icon: ReactNode; activeIcon?: ReactNode }> = {
  dashboard: {
    label: 'Dashboard',
    icon: <House size={22} strokeWidth={1.5}/>,
    activeIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 10.7a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6a2 2 0 0 1 .7 1.5V19a2 2 0 0 1-2 2h-4v-5.5a1.4 1.4 0 0 0-1.4-1.4h-3.2A1.4 1.4 0 0 0 9 15.5V21H5a2 2 0 0 1-2-2z"/>
      </svg>
    ),
  },
  favorites: { label: 'Saved items', icon: <Heart size={22} strokeWidth={1.5}/> },
  cart: { label: 'Cart', icon: <ShoppingBag size={22} strokeWidth={1.5}/> },
  topup: { label: 'Top up', icon: <Wallet size={22} strokeWidth={1.5}/> },
  seller: { label: 'Store', icon: <Store size={22} strokeWidth={1.5}/> },
  notifications: { label: 'Notifications', icon: <Bell size={22} strokeWidth={1.5}/> },
  settings: { label: 'Settings', icon: <Settings size={22} strokeWidth={1.5}/> },
  help: { label: 'Help', icon: <CircleHelp size={22} strokeWidth={1.5}/> },
  security: { label: 'Security', icon: <ShieldCheck size={22} strokeWidth={1.5}/> },
};
const railIcons: Partial<Record<MenuBarKey, ReactNode>> = {
  favorites: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 7 .4-2.1a2.1 2.1 0 0 1 2.5-1.6l7.1 1.5a2.2 2.2 0 0 1 1.7 2.6l-1.9 9a2 2 0 0 1-2.8 1.5"/>
      <path d="M5 7h5l4 4v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/>
      <path d="M10 7v3a1 1 0 0 0 1 1h3"/>
    </svg>
  ),
  cart: <SquareCheck size={24} strokeWidth={1.6}/>,
  help: <AtSign size={24} strokeWidth={1.6}/>,
  seller: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="9" height="9" rx="1.5"/>
      <rect x="15.5" y="3" width="5.5" height="5.5" rx="1.2"/>
      <rect x="3" y="15.5" width="5.5" height="5.5" rx="1.2"/>
      <rect x="12" y="12" width="9" height="9" rx="1.5"/>
    </svg>
  ),
};
const defaultItems: readonly MenuBarKey[] = ['dashboard', 'notifications', 'settings', 'help', 'security'];

function MoreMenu({ items, active, labels, hrefs, onSelect }: Pick<MenuBarProps, 'active' | 'labels' | 'hrefs' | 'onSelect'> & { items: MenuBarGroup }) {
  const isActive = active != null && items.includes(active);
  return <div className="amb-item">
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={cn('amb-button', isActive && 'is-active')} aria-label="เมนูเพิ่มเติม" title="เมนูเพิ่มเติม">
        <span className="amb-icon" aria-hidden="true"><Ellipsis size={24} strokeWidth={2}/></span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={7} collisionPadding={12} className="profile-dropdown-content" aria-label="เมนูเพิ่มเติม">
        {items.map(key => {
          const label = labels?.[key] || menuItems[key].label;
          const contents = <>{menuItems[key].icon}<span>{label}</span></>;
          const href = hrefs?.[key];
          const current = active === key ? 'page' : undefined;
          return href
            ? <DropdownMenuItem key={key} asChild className="profile-dropdown-item">
                <a href={href} aria-current={current} onClick={event => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                  event.preventDefault();
                  onSelect?.(key);
                }}>{contents}</a>
              </DropdownMenuItem>
            : <DropdownMenuItem key={key} className="profile-dropdown-item" aria-current={current} onSelect={() => onSelect?.(key)}>{contents}</DropdownMenuItem>;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}
function IconButton({ itemKey, icon, label, active, vertical, href, count = 0, onClick }: { itemKey: MenuBarKey; icon: ReactNode; label: string; active: boolean; vertical: boolean; href?: string; count?: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false), [tooltip, setTooltip] = useState(false);
  const timeout = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const expanded = hovered || focused || (vertical ? tooltip : active);
  const Tag = href ? 'a' : 'button';
  useEffect(() => () => { if (timeout.current !== null) window.clearTimeout(timeout.current); }, []);
  return <Tag href={href} type={href ? undefined : 'button'} data-menu-key={itemKey} aria-label={count > 0 ? `${label} (${count})` : label} aria-current={href && active ? 'page' : undefined} aria-pressed={href ? undefined : active} className={cn('amb-button', active && 'is-active')} onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (href) { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); }
    if (matchMedia('(max-width: 639px)').matches) {
      setTooltip(true); if (timeout.current !== null) window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => setTooltip(false), 1200);
    }
    onClick();
  }}>
    <span className="amb-icon" aria-hidden="true">{icon}</span>
    {count > 0 && <span className="amb-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
    <motion.span aria-hidden="true" className="amb-label-clip" initial={false} animate={{ width: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0, marginLeft: expanded && !vertical ? 8 : 0 }} transition={reduce ? { duration: 0 } : { width: { type: 'spring', stiffness: 380, damping: 34 }, opacity: { duration: .18 }, marginLeft: { duration: .22 } }}><span>{label}</span></motion.span>
    {!vertical && <span className={cn('amb-tooltip', tooltip && 'is-visible')} aria-hidden="true">{label}</span>}
  </Tag>;
}
export function MenuBar({ active = 'dashboard', onSelect, labels, orientation = 'horizontal', items = defaultItems, counts, hrefs, className, 'aria-label': ariaLabel = 'เมนูพื้นที่สมาชิก' }: MenuBarProps) {
  return <nav className={cn('animated-menu-bar', orientation === 'vertical' && 'amb-vertical', className)} aria-label={ariaLabel}>
    {items.map((key, index) => {
      if (typeof key !== 'string') return <MoreMenu key={`more-${key[0]}`} items={key} active={active} labels={labels} hrefs={hrefs} onSelect={onSelect}/>;
      const item = menuItems[key];
      const selected = active === key;
      const icon = orientation === 'vertical'
        ? (selected ? item.activeIcon : undefined) ?? railIcons[key] ?? item.icon
        : item.icon;
      return <div key={key} className="amb-item">
        {index > 0 && (key === 'notifications' || typeof items[index - 1] !== 'string') && <span className="amb-divider" aria-hidden="true"/>}
        <IconButton itemKey={key} icon={icon} label={labels?.[key] || item.label} count={counts?.[key]} href={hrefs?.[key]} vertical={orientation === 'vertical'} active={selected} onClick={() => onSelect?.(key)}/>
      </div>;
    })}
  </nav>;
}
export default MenuBar;

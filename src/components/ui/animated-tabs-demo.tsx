import { Home, PhoneCall, Settings, User } from 'lucide-react';
import AnimatedBackground from './animated-tabs';
const tabs = [{ label: 'Home', icon: Home }, { label: 'About', icon: User }, { label: 'Services', icon: Settings }, { label: 'Contact', icon: PhoneCall }];
export function AnimatedTabs() { return <div className="flex gap-2 rounded-xl border bg-white p-2"><AnimatedBackground defaultValue="Home" className="rounded-lg bg-zinc-100" transition={{ type: 'spring', bounce: .2, duration: .3 }}>{tabs.map(tab => <button key={tab.label} data-id={tab.label} aria-label={tab.label} className="inline-flex h-9 w-9 items-center justify-center"><tab.icon className="h-5 w-5"/></button>)}</AnimatedBackground></div>; }
export function AnimatedTabsHover() { return <AnimatedBackground defaultValue="Home" className="rounded-lg bg-zinc-100" enableHover>{tabs.map(tab => <button key={tab.label} data-id={tab.label} className="px-2 py-1">{tab.label}</button>)}</AnimatedBackground>; }
export function SegmentedControl() { return <AnimatedBackground defaultValue="Day" className="rounded-lg bg-white" transition={{ duration: .2 }}>{['Day', 'Week', 'Month', 'Year'].map(label => <button key={label} data-id={label} className="w-20 text-center">{label}</button>)}</AnimatedBackground>; }
export default { AnimatedTabs, AnimatedTabsHover, SegmentedControl };

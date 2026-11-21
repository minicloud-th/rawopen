'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { Children, cloneElement, useId, useState, type ReactElement, type ReactNode, type MouseEventHandler, type FocusEventHandler } from 'react';

type TabChild = {
  'data-id': string; 'data-checked'?: string; 'aria-selected'?: boolean; 'aria-pressed'?: boolean; children?: ReactNode; className?: string; role?: string;
  onClick?: MouseEventHandler<HTMLElement>; onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>; onFocus?: FocusEventHandler<HTMLElement>;
};
type AnimatedBackgroundProps = {
  children: ReactElement<TabChild>[] | ReactElement<TabChild>;
  defaultValue?: string; value?: string | null; onValueChange?: (id: string | null) => void;
  className?: string; transition?: Transition; enableHover?: boolean;
};

// Supplied shared-background tabs, with controlled selection, composed handlers and reduced motion.
export default function AnimatedBackground({ children, defaultValue, value, onValueChange, className, transition, enableHover = false }: AnimatedBackgroundProps) {
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null);
  const activeId = value === undefined ? internal : value;
  const uniqueId = useId(), reduce = useReducedMotion();
  const activate = (id: string | null) => { setInternal(id); onValueChange?.(id); };
  return Children.map(children, child => {
    const id = child.props['data-id'];
    return cloneElement(child, {
      className: cn('relative inline-flex', child.props.className),
      ...(child.props.role === 'tab' ? { 'aria-selected': activeId === id } : { 'aria-pressed': activeId === id }),
      'data-checked': activeId === id ? 'true' : 'false',
      onClick: event => { child.props.onClick?.(event); if (!event.defaultPrevented) activate(id); },
      onMouseEnter: event => { child.props.onMouseEnter?.(event); if (enableHover) activate(id); },
      onMouseLeave: event => { child.props.onMouseLeave?.(event); if (enableHover) activate(null); },
      onFocus: event => { child.props.onFocus?.(event); if (enableHover) activate(id); },
    } as Partial<TabChild>, <>
      <AnimatePresence initial={false}>{activeId === id && <motion.span aria-hidden="true" layoutId={reduce ? undefined : `background-${uniqueId}`} className={cn('pointer-events-none absolute inset-0', className)} transition={reduce ? { duration: 0 } : transition} initial={{ opacity: defaultValue ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/>}</AnimatePresence>
      <span className="relative z-10">{child.props.children}</span>
    </>);
  });
}

import type { MemberPath } from './member-navigation';

export function navigateAuth(path: MemberPath | '/' | '/#discover' | '/signup' | '/login' | '/reset-password' | '/dashboard#discover' | '/welcome' | '/privacy' | '/terms' | '/seller-terms' | '/legal/guardians' | '/sell' | '/contact', { preserveScroll = false, replace = false, state = null }: { preserveScroll?: boolean; replace?: boolean; state?: object | null } = {}) {
  if (replace) history.replaceState(state ?? history.state, '', path);
  else history.pushState(state, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
  if (!preserveScroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

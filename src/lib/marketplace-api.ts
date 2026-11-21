import { useEffect, useState } from 'react';
import { products } from './catalog';

export type Product = typeof products[number];
export type Quote = { currency: 'THB'; checkoutEnabled: false; totalSatang: number; items: { id: string; quantity: number; unitSatang: number; lineSatang: number }[] };
export type TopupPreview = { amountSatang: number; method: 'promptpay' | 'card'; currency: 'THB'; paymentsEnabled: false };
type CatalogFilters = { query: string; category: string; filter: string; sort: string };
type Catalog = { products: Product[]; count: number; currency: 'THB'; sampleCatalog: true };

export class MarketplaceError extends Error {
  constructor(public code: string) { super(code); }
}
async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(10000);
  const signal = options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const response = await fetch(path, { ...options, signal, headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...options?.headers } });
  const value = await response.json().catch(() => null);
  if (!response.ok || value === null) throw new MarketplaceError(typeof value?.error === 'string' ? value.error : 'api-unavailable');
  return value as T;
}
export async function previewTopup(amount: string, method: TopupPreview['method'], signal?: AbortSignal): Promise<TopupPreview> {
  const result = await apiRequest<TopupPreview>('/api/topup/preview', { method: 'POST', body: JSON.stringify({ amount, method }), signal });
  if (!Number.isSafeInteger(result.amountSatang) || result.amountSatang <= 0 || result.currency !== 'THB' || result.method !== method || result.paymentsEnabled !== false) throw new MarketplaceError('invalid-response');
  return result;
}
export function useCatalogResults(filters: CatalogFilters) {
  const { query, category, filter, sort } = filters;
  const key = JSON.stringify([query, category, filter, sort]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; data: Catalog | null; loading: boolean; error: boolean }>({ key, data: null, loading: true, error: false });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, data: null, loading: true, error: false });
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: query, category, filter, sort });
      apiRequest<Catalog>(`/api/catalog?${params}`, { signal: controller.signal }).then(data => {
        if (!Array.isArray(data.products)) throw new MarketplaceError('invalid-response');
        if (!controller.signal.aborted) setState({ key, data, loading: false, error: false });
      }).catch(() => { if (!controller.signal.aborted) setState({ key, data: null, loading: false, error: true }); });
    }, query ? 120 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [key, query, category, filter, sort, attempt]);
  return { ...(state.key === key ? state : { data: null, loading: true, error: false }), retry: () => setAttempt(value => value + 1) };
}
export function useCartQuote(items: { id: string; qty: number }[]) {
  const key = JSON.stringify(items.map(({ id, qty }) => ({ id, quantity: qty })));
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; data: Quote | null; loading: boolean; error: boolean }>({ key, data: null, loading: !!items.length, error: false });
  useEffect(() => {
    const controller = new AbortController();
    const lines = JSON.parse(key) as { id: string; quantity: number }[];
    if (!lines.length) { setState({ key, data: null, loading: false, error: false }); return () => controller.abort(); }
    setState({ key, data: null, loading: true, error: false });
    apiRequest<Quote>('/api/quote', { method: 'POST', body: JSON.stringify({ items: lines }), signal: controller.signal }).then(data => {
      if (!Array.isArray(data.items) || !Number.isSafeInteger(data.totalSatang) || data.totalSatang < 0 || data.checkoutEnabled !== false) throw new MarketplaceError('invalid-response');
      if (!controller.signal.aborted) setState({ key, data, loading: false, error: false });
    }).catch(() => { if (!controller.signal.aborted) setState({ key, data: null, loading: false, error: true }); });
    return () => controller.abort();
  }, [key, attempt]);
  return { ...(state.key === key ? state : { data: null, loading: true, error: false }), retry: () => setAttempt(value => value + 1) };
}

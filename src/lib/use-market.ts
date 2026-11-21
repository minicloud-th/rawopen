import { useEffect, useState } from 'react';
import { getMarketSnapshot } from '@/commerce.js';

// A small bridge to the existing browser-local cart, favorites and dialog system.
export function useMarket() {
  const [market, setMarket] = useState(getMarketSnapshot);
  useEffect(() => {
    const update = () => setMarket(getMarketSnapshot());
    document.addEventListener('opencraft:market-change', update);
    update();
    return () => document.removeEventListener('opencraft:market-change', update);
  }, []);
  return market;
}

import { useEffect, type RefObject } from "react";

/** Reveal photography once per product, and immediately expose keyboard-focused content. */
export function useSoftReveals(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = root.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const prepared = new WeakSet<HTMLElement>(), seen = new Set<string>(), waiting = new Set<HTMLElement>();
    const finish = (target: HTMLElement) => {
      target.dataset.ocRevealState = "visible";
      if (target.dataset.ocReveal) seen.add(target.dataset.ocReveal);
      waiting.delete(target); observer.unobserve(target);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) finish(entry.target as HTMLElement); });
    }, { threshold: .06 });
    const collect = () => {
      waiting.forEach(target => { if (!target.isConnected) { observer.unobserve(target); waiting.delete(target); } });
      node.querySelectorAll<HTMLElement>("[data-oc-reveal]").forEach(target => {
      if (prepared.has(target)) return;
      prepared.add(target);
      if (media.matches || seen.has(target.dataset.ocReveal || "")) { target.dataset.ocRevealState = "visible"; return; }
      target.dataset.ocRevealState = "waiting"; waiting.add(target); observer.observe(target);
      });
    };
    const mutation = new MutationObserver(collect);
    const onMotion = () => { if (media.matches) [...waiting].forEach(finish); };
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-oc-reveal]");
      if (target) finish(target);
    };
    collect(); mutation.observe(node, { childList: true, subtree: true });
    node.addEventListener("focusin", onFocus); media.addEventListener("change", onMotion);
    return () => {
      mutation.disconnect(); observer.disconnect();
      node.removeEventListener("focusin", onFocus); media.removeEventListener("change", onMotion);
      waiting.forEach(target => { target.dataset.ocRevealState = "visible"; });
    };
  }, [root]);
}

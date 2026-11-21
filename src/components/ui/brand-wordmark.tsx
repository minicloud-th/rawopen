export function BrandWordmark({ className = "" }: { className?: string }) {
  return <svg className={"oc-wordmark " + className} viewBox="220 170 1645 330" role="img" aria-label="OpenCraft">
    <image href="/assets/opencraft-wordmark.png" width="2048" height="682"/>
  </svg>;
}

async function verifyRoute(routePath: string) {
  const url = `https://lightningapi.pro${routePath}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'curl/7.68.0' } });
  const text = await res.text();
  const hasRootContent = text.includes('<div id="root"><div class=');
  const titleMatch = text.match(/<title>(.*?)<\/title>/);
  console.log(`Route "${routePath}" ──> Status: ${res.status} | Length: ${(text.length / 1024).toFixed(1)} KB | Full HTML in Root: ${hasRootContent} | Title: "${titleMatch?.[1]}"`);
  if (!hasRootContent || text.length < 5000) {
    console.error(`❌ CRITICAL: Route "${routePath}" returned empty or un-rendered HTML shell!`);
  }
}

async function main() {
  console.log('⚡ Auditing All Public Marketing Routes via plain HTTP fetch (curl user-agent)...\n');
  const routes = ['/', '/docs', '/pricing', '/models', '/status', '/trial', '/check-key', '/request-quote', '/terms', '/privacy', '/refund'];
  for (const r of routes) {
    await verifyRoute(r);
  }
}

main().catch(console.error);

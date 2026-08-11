async function inspectUrl(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const text = await res.text();
  const titleMatch = text.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : 'No title';
  const rootIdx = text.indexOf('<div id="root">');
  const rootSnippet = rootIdx !== -1 ? text.substring(rootIdx, rootIdx + 150) : 'No root div';
  console.log(`URL: ${url}`);
  console.log(`  Status: ${res.status}`);
  console.log(`  Title: "${title}"`);
  console.log(`  Length: ${text.length}`);
  console.log(`  Root snippet: ${rootSnippet}\n`);
}

async function main() {
  await inspectUrl('https://lightningapi.pro/');
  await inspectUrl('https://lightningapi.pro/index.html');
  await inspectUrl('https://lightningapi.pro/docs');
  await inspectUrl('https://lightningapi.pro/pricing');
}

main().catch(console.error);

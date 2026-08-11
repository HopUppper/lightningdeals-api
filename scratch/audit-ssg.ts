async function testFetch(userAgent: string) {
  const res = await fetch('https://lightningapi.pro', {
    headers: { 'User-Agent': userAgent },
  });
  const text = await res.text();
  console.log(`User-Agent: "${userAgent}" ──> Status: ${res.status} | Length: ${text.length} | Contains root div content: ${text.includes('selection:bg-amber-500')}`);
}

async function main() {
  await testFetch('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  await testFetch('ClaudeBot/1.0');
  await testFetch('curl/7.68.0');
  await testFetch('python-requests/2.25.1');
}

main().catch(console.error);

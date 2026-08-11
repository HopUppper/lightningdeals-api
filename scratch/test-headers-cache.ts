async function testHttpMethods(url: string) {
  console.log(`=== Testing ${url} ===`);
  const resGet = await fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
  const textGet = await resGet.text();
  console.log(`GET Status: ${resGet.status}`);
  console.log(`GET ETag: ${resGet.headers.get('etag')}`);
  console.log(`GET Cache-Control: ${resGet.headers.get('cache-control')}`);
  console.log(`GET Title: ${textGet.match(/<title>(.*?)<\/title>/)?.[1]}`);
  console.log(`GET Length: ${textGet.length}`);
  console.log(`GET Has Root Content: ${textGet.includes('selection:bg-amber-500')}\n`);
}

async function main() {
  await testHttpMethods('https://lightningapi.pro');
  await testHttpMethods('https://lightningapi.pro/');
  await testHttpMethods('https://lightningapi.pro/index.html');
}

main().catch(console.error);

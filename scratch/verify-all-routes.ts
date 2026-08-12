async function verifyAllRoutes() {
  const routes = [
    '/',
    '/docs',
    '/pricing',
    '/models',
    '/status',
    '/api/system/status',
    '/v1',
  ];

  console.log('⚡ Auditing live HTTP responses on https://lightningapi.pro...');
  for (const route of routes) {
    try {
      const res = await fetch(`https://lightningapi.pro${route}`);
      console.log(`Route ${route.padEnd(20)}: ${res.status} ${res.statusText}`);
    } catch (err: any) {
      console.error(`Route ${route} failed: ${err.message}`);
    }
  }
}

verifyAllRoutes().catch(console.error);

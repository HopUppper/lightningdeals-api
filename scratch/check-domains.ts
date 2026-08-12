async function checkDomains() {
  const domains = [
    'https://lightningdeals-api.onrender.com',
    'https://lightningapi.pro',
    'https://www.lightningapi.pro',
  ];

  for (const d of domains) {
    try {
      const res = await fetch(d, { redirect: 'follow' });
      console.log(`${d.padEnd(45)} -> Status: ${res.status} ${res.statusText}`);
    } catch (err: any) {
      console.log(`${d.padEnd(45)} -> Error: ${err.message}`);
    }
  }
}

checkDomains().catch(console.error);

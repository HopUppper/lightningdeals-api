async function checkProductionLive() {
  console.log('⚡ Checking production deployment on https://lightningapi.pro...');
  try {
    const res = await fetch('https://lightningapi.pro/api/system/status');
    console.log(`Production Gateway HTTP Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log('Production System Status Response:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Error fetching production status:', err.message);
  }
}

checkProductionLive().catch(console.error);

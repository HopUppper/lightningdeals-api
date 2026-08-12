async function testRender() {
  console.log('Testing connection to https://lightningapi.pro...');
  try {
    const res = await fetch('https://lightningapi.pro');
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Body (first 300 chars): ${text.slice(0, 300)}`);
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testRender().catch(console.error);

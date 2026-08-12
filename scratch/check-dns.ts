import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

async function checkDns() {
  console.log('🔍 Checking DNS resolution for lightningapi.pro...');
  try {
    const cnames = await resolveCname('lightningapi.pro');
    console.log('CNAME records:', cnames);
  } catch (e: any) {
    console.log('No CNAME record or error:', e.message);
  }

  try {
    const ips = await resolve4('lightningapi.pro');
    console.log('A records:', ips);
  } catch (e: any) {
    console.log('A record error:', e.message);
  }

  console.log('\n🔍 Checking direct Render domain (lightningdeals-api.onrender.com)...');
  try {
    const res = await fetch('https://lightningdeals-api.onrender.com/api/system/status');
    console.log(`Render status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('Render system status:', JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error('Render direct domain error:', e.message);
  }
}

checkDns().catch(console.error);

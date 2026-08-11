import http from 'http';

async function testAdminAuth() {
  console.log('⚡ Testing Admin Endpoint Authorization & Status Codes...\n');

  const options = {
    hostname: 'localhost',
    port: 3001, // Express server port
    path: '/api/admin/providers',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    console.log(`Unauthenticated GET /api/admin/providers status code: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`Response body: ${data}\n`);
      if (res.statusCode === 401 || res.statusCode === 403) {
        console.log('✅ Admin Authorization Enforcement: PASSED (Returns 401/403 when unauthenticated)');
      } else {
        console.error('❌ Admin Authorization Enforcement: FAILED');
      }
    });
  });

  req.on('error', (err) => {
    console.log('Server not currently running on port 3001 locally, skipping HTTP fetch test');
  });

  req.end();
}

testAdminAuth();

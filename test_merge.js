const http = require('http');

const data = JSON.stringify({
  items: [{ variantId: 'TEST1', name: 'Test', price: 100, quantity: 1, image: 'img.jpg' }]
});

const req = http.request({
  hostname: 'localhost',
  port: 5003,
  path: '/api/cart/merge',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer vdt_secret_2026' // Usually fails verify because JWT requires actual sign
  }
}, (res) => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', d));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();

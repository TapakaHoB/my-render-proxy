const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // Ping endpoint
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return;
  }

  // Проксируем запрос
  const target = req.url.startsWith('http') ? req.url : 'https://' + req.headers.host + req.url;
  
  proxy.web(req, res, {
    target: target,
    changeOrigin: true,
    secure: false,
    headers: {
      'X-Forwarded-For': req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
  });

  proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

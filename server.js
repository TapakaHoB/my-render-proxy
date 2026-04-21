const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // 1. Эндпоинт для проверки жизни (ping)
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return;
  }

  // 2. Проксирование обычных запросов
  const target = req.url.startsWith('http') ? req.url : 'https://' + req.headers.host + req.url;
  
  proxy.web(req, res, {
    target: target,
    changeOrigin: true,
    secure: false
  });
});

// 3. Обработка туннелирования (ВАЖНО для HTTPS сайтов)
server.on('connect', (req, cltSocket, head) => {
  proxy.ws(req, cltSocket, head, {
    target: 'https://' + req.url,
    secure: false
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});

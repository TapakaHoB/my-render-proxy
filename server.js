const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');

const server = http.createServer((req, res) => {
    // 1. Эндпоинт для проверки (ping)
    if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('pong');
        return;
    }

    // 2. Определяем целевой адрес
    let target = req.url;
    if (!target.startsWith('http')) {
        target = 'https://' + req.headers.host + req.url;
    }
    
    const parsedUrl = url.parse(target);
    const isHttps = parsedUrl.protocol === 'https:';
    // Выбираем модуль: https или http
    const agent = isHttps ? https : http;

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: req.method,
        headers: req.headers,
        rejectUnauthorized: false // Игнорируем ошибки SSL сертификатов
    };

    // 3. Отправляем запрос
    const proxyReq = agent.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        console.error('Proxy error:', e);
        res.writeHead(500);
        res.end('Proxy Error: ' + e.message);
    });

    req.pipe(proxyReq);
});

// 4. Обработка туннелей (CONNECT method) - ВАЖНО для HTTPS!
server.on('connect', (req, cltSocket, head) => {
    const parts = req.url.split(':');
    const host = parts[0];
    const port = parts[1] || 443;
    
    console.log(`Tunneling to ${host}:${port}`);

    const srvSocket = net.connect(port, host, () => {
        cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        srvSocket.pipe(cltSocket);
        cltSocket.pipe(srvSocket);
    });

    srvSocket.on('error', (err) => {
        console.error('Tunnel error:', err);
        cltSocket.end();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Native Proxy running on port ${PORT}`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
    let rawPath = req.url.split('?')[0];
    try {
        rawPath = decodeURIComponent(rawPath);
    } catch {
        // Use rawPath if malformed URI
    }

    let safePath = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = 'index.html';
    }

    let filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content);
        }
    });
});

const portsToTry = [
    process.env.PORT ? parseInt(process.env.PORT, 10) : null,
    8081,
    3001,
    5173,
    8080
].filter(Boolean);

let currentPortIndex = 0;

function listenOnNextPort() {
    if (currentPortIndex >= portsToTry.length) {
        console.error('Could not find an open port to start the server.');
        process.exit(1);
    }

    const port = portsToTry[currentPortIndex];
    server.listen(port);
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${portsToTry[currentPortIndex]} is in use, trying next port...`);
        currentPortIndex++;
        listenOnNextPort();
    } else {
        console.error('Server error:', err);
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`\n========================================`);
    console.log(`  G PERYA Dev Server is running!`);
    console.log(`  Local: http://localhost:${address.port}/`);
    console.log(`========================================\n`);
});

listenOnNextPort();

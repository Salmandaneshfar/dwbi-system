const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
};

function initData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            users: {},
            modules: {}
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('Data file created:', DATA_FILE);
    }
}

function readData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return { users: {}, modules: {} };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        return false;
    }
}

const server = http.createServer((req, res) => {
    console.log(req.method + ' ' + req.url);
    
    if (req.url === '/api/data' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        const data = readData();
        res.writeHead(200);
        res.end(JSON.stringify(data));
        return;
    }
    
    if (req.url === '/api/data' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                writeData(data);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, function(error, content) {
        if (error) {
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

initData();

server.listen(PORT, '0.0.0.0', function() {
    console.log('==========================================');
    console.log('  DWBI Server with API');
    console.log('==========================================');
    console.log('Port: ' + PORT);
    console.log('Data: ' + DATA_FILE);
    console.log('API:  GET/POST /api/data');
    console.log('==========================================');
});

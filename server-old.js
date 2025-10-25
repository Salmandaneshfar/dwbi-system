const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_FILE = 'data.json';

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// ایجاد فایل داده اولیه
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            users: {
                'admin': {
                    password: 'admin123',
                    role: 'admin',
                    fullName: 'مدیر سیستم',
                    createdAt: new Date().toISOString(),
                    createdBy: 'system'
                },
                'editor1': {
                    password: 'editor123',
                    role: 'editor',
                    fullName: 'ویرایشگر اول',
                    createdAt: new Date().toISOString(),
                    createdBy: 'system'
                },
                'user1': {
                    password: 'user123',
                    role: 'user',
                    fullName: 'کاربر معمولی',
                    createdAt: new Date().toISOString(),
                    createdBy: 'system'
                }
            },
            modules: {}
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('✅ Data file created:', DATA_FILE);
    }
}

function readData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
        console.error('Error reading data:', err);
        return { users: {}, modules: {} };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing data:', err);
        return false;
    }
}

const server = http.createServer((req, res) => {
    const timestamp = new Date().toLocaleString('fa-IR');
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    // API Endpoints
    if (req.url.startsWith('/api/')) {
        handleAPI(req, res);
        return;
    }
    
    // Static files
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<html><body><h1>404 - File Not Found</h1></body></html>', 'utf-8');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<html><body><h1>500 - Server Error</h1></body></html>', 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(content, 'utf-8');
        }
    });
});

function handleAPI(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        try {
            const data = readData();
            
            // GET /api/sync - دریافت همه داده‌ها
            if (req.method === 'GET' && req.url === '/api/sync') {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, data: data }));
            }
            
            // POST /api/sync - ذخیره همه داده‌ها
            else if (req.method === 'POST' && req.url === '/api/sync') {
                const newData = JSON.parse(body);
                if (writeData(newData)) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, message: 'Data synced successfully' }));
                } else {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: 'Failed to sync data' }));
                }
            }
            
            else {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, message: 'API endpoint not found' }));
            }
        } catch (error) {
            console.error('API Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: error.message }));
        }
    });
}

// شروع سرور
initDataFile();

server.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('  DWBI Server - JSON Backend');
    console.log('==========================================');
    console.log('Port:      ' + PORT);
    console.log('URL:       http://localhost:' + PORT);
    console.log('Storage:   ' + path.resolve(DATA_FILE));
    console.log('Mode:      Centralized (Server-side)');
    console.log('Time:      ' + new Date().toLocaleString('fa-IR'));
    console.log('==========================================');
});

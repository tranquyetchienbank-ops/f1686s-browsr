const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('📂 Current directory:', __dirname);
console.log('📄 Files:', fs.readdirSync(__dirname));

app.use(express.json());
app.use(express.static(__dirname));

// Đọc file Tampermonkey script
const tampermonkeyScript = fs.readFileSync(
    path.join(__dirname, 'tampermonkey-script.js'), 
    'utf8'
);

// Proxy endpoint để lấy trang web và inject script
app.get('/proxy', (req, res) => {
    const targetUrl = 'https://f1686s.com';
    
    https.get(targetUrl, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            // Inject script vào HTML
            let html = data;
            
            // Thêm script vào cuối body
            const scriptTag = `
                <script>
                    // Inject Tampermonkey script
                    (function() {
                        const script = document.createElement('script');
                        script.textContent = ${JSON.stringify(tampermonkeyScript)};
                        document.head.appendChild(script);
                        console.log('✅ Tampermonkey script injected');
                    })();
                </script>
            `;
            
            // Chèn vào body
            html = html.replace('</body>', scriptTag + '</body>');
            
            // Thêm meta viewport nếu chưa có
            if (!html.includes('viewport')) {
                html = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
            }
            
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        });
    }).on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).send('Error loading page');
    });
});

// Trang chính - hiển thị iframe với proxy
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        files: fs.readdirSync(__dirname)
    });
});

app.listen(PORT, () => {
    console.log(`✅ Cloud Browser running on port ${PORT}`);
    console.log(`🔗 Visit: http://localhost:${PORT}`);
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('📂 Current directory:', __dirname);

// Đọc file Tampermonkey script
let tampermonkeyScript = '';
try {
    tampermonkeyScript = fs.readFileSync(
        path.join(__dirname, 'tampermonkey-script.js'), 
        'utf8'
    );
    console.log('✅ Tampermonkey script loaded, length:', tampermonkeyScript.length);
} catch (error) {
    console.error('❌ Cannot load tampermonkey-script.js:', error.message);
}

app.use(express.json());
app.use(express.static(__dirname));

// Proxy endpoint - lấy trang web và inject script
app.get('/load', (req, res) => {
    console.log('🔄 Loading page via proxy...');
    
    const targetUrl = 'https://f1686s.com';
    
    https.get(targetUrl, (response) => {
        let data = '';
        
        response.on('data', chunk => data += chunk);
        
        response.on('end', () => {
            try {
                // Inject script vào HTML
                let html = data;
                
                // Kiểm tra xem đã có script chưa
                if (!html.includes('__TAMPERMONKEY_RUNNING')) {
                    // Tạo script injection
                    const injectionScript = `
                        <script>
                            (function() {
                                console.log('🟢 Injecting Tampermonkey script...');
                                
                                // Nội dung script từ server
                                const scriptContent = ${JSON.stringify(tampermonkeyScript)};
                                
                                // Tạo script element
                                const script = document.createElement('script');
                                script.textContent = scriptContent;
                                script.setAttribute('data-injected', 'true');
                                
                                // Thêm vào head
                                if (document.head) {
                                    document.head.appendChild(script);
                                    console.log('✅ Tampermonkey script injected successfully!');
                                } else {
                                    console.error('❌ No head element found');
                                }
                                
                                // Thêm vào body nếu head không có
                                setTimeout(() => {
                                    if (!document.querySelector('[data-injected]')) {
                                        const script2 = document.createElement('script');
                                        script2.textContent = scriptContent;
                                        script2.setAttribute('data-injected', 'true');
                                        document.body.appendChild(script2);
                                        console.log('✅ Tampermonkey script injected to body');
                                    }
                                }, 500);
                            })();
                        </script>
                    `;
                    
                    // Chèn vào trước </head> hoặc </body>
                    if (html.includes('</head>')) {
                        html = html.replace('</head>', injectionScript + '</head>');
                    } else if (html.includes('</body>')) {
                        html = html.replace('</body>', injectionScript + '</body>');
                    } else {
                        html = injectionScript + html;
                    }
                    
                    console.log('✅ Script injected to HTML');
                } else {
                    console.log('⚠️ Script already exists in HTML');
                }
                
                // Thêm meta viewport
                if (!html.includes('viewport')) {
                    html = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
                }
                
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Cache-Control', 'no-cache');
                res.send(html);
                
            } catch (error) {
                console.error('❌ Error processing HTML:', error);
                res.status(500).send('Error processing page');
            }
        });
        
    }).on('error', (err) => {
        console.error('❌ Proxy error:', err);
        res.status(500).send('Cannot load page: ' + err.message);
    });
});

// Trang chính
app.get('/', (req, res) => {
    console.log('📄 Serving index.html');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve Tampermonkey script
app.get('/tampermonkey-script.js', (req, res) => {
    const scriptPath = path.join(__dirname, 'tampermonkey-script.js');
    if (fs.existsSync(scriptPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(scriptPath);
    } else {
        res.status(404).send('Script not found');
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        scriptLoaded: tampermonkeyScript.length > 0,
        files: fs.readdirSync(__dirname)
    });
});

app.listen(PORT, () => {
    console.log(`✅ Cloud Browser running on port ${PORT}`);
    console.log(`🔗 Visit: http://localhost:${PORT}`);
});

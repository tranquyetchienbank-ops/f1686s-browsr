const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('📂 Current directory:', __dirname);
console.log('📄 Files:', fs.readdirSync(__dirname));

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Trang chính
app.get('/', (req, res) => {
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
        files: fs.readdirSync(__dirname)
    });
});

app.listen(PORT, () => {
    console.log(`✅ Cloud Browser running on port ${PORT}`);
    console.log(`🔗 Visit: http://localhost:${PORT}`);
});

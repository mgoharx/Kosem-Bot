const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

// 🛡️ ANTI-CRASH SYSTEM
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err.message));

const app = express();
const PORT = process.env.PORT || 3000;

// 📦 INCREASED LIMITS FOR MOBILE BROWSERS
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 📝 LIVE LOGS SYSTEM
const clients = [];
function sendLog(msg) {
    console.log(msg); 
    clients.forEach(c => c.write(`data: ${msg}\n\n`)); 
}

// 👑 KOSEM PREMIUM FRONTEND + PANEL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
            <title>Kosem Pairing System</title>
            <style>
                body, html { margin: 0; padding: 0; min-height: 100vh; width: 100vw; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #111111, #000000, #1a1a1a); background-attachment: fixed; color: #ffffff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .circle1, .circle2 { position: absolute; border-radius: 50%; filter: blur(90px); z-index: 0; animation: float 8s ease-in-out infinite alternate; }
                .circle1 { width: 350px; height: 350px; background: rgba(255, 255, 255, 0.04); top: -10%; left: -10%; }
                .circle2 { width: 400px; height: 400px; background: rgba(255, 255, 255, 0.06); bottom: -10%; right: -10%; animation-delay: -4s; }
                @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(20px); } }

                .glass-card { position: relative; z-index: 1; width: 100%; max-width: 380px; padding: 40px 25px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 40px 80px -15px rgba(0, 0, 0, 0.8); text-align: center; box-sizing: border-box; transition: height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); overflow: hidden; }
                h2 { margin: 0 0 10px; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
                p { color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-bottom: 25px; line-height: 1.5; }
                
                .toggle-box { display: flex; background: rgba(0, 0, 0, 0.4); border-radius: 12px; margin-bottom: 25px; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
                .toggle-btn { flex: 1; padding: 12px; cursor: pointer; color: rgba(255,255,255,0.4); font-weight: 600; font-size: 13px; z-index: 2; position: relative; -webkit-tap-highlight-color: transparent; user-select: none; }
                .toggle-btn.active { color: #ffffff; }
                .toggle-bg { position: absolute; top: 0; left: 0; width: 33.33%; height: 100%; background: rgba(255, 255, 255, 0.12); border-radius: 12px; z-index: 1; transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }

                input { width: 100%; padding: 16px; margin-bottom: 20px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: white; text-align: center; outline: none; box-sizing: border-box; transition: all 0.3s ease; }
                input:focus { background: rgba(0, 0, 0, 0.5); border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 0 15px rgba(255, 255, 255, 0.05); }
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                
                .action-btn { width: 100%; padding: 16px; background: #ffffff; color: #000000; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease; }
                .action-btn:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 6px 15px rgba(0,0,0,0.3); }
                .action-btn:active { transform: translateY(1px); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .action-btn:disabled { background: #555; color: #aaa; cursor: not-allowed; transform: none; box-shadow: none; }
                
                .tab-content { display: none; opacity: 0; transform: translateY(15px); transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
                .tab-content.active { display: block; }
                .tab-content.show { opacity: 1; transform: translateY(0); }

                #code-container, #qr-result, #deploy-result { margin-top: 25px; }
                .code-box { font-size: 32px; font-weight: bold; letter-spacing: 6px; background: rgba(0, 0, 0, 0.4); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); display: inline-block; margin-bottom: 15px; color: #fff; }
                .qr-image { border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px; background: white; margin-bottom: 15px; }
                .instructions { font-size: 13px; color: rgba(255, 255, 255, 0.4); line-height: 1.5; }
                .loading { color: #cccccc; font-weight: 500; animation: pulse 1.5s infinite; }
                .error { color: #ff5555; font-weight: 500; }
                .success { color: #50fa7b; font-weight: 600; font-size: 16px; }
                
                #live-logs { display: none; margin-top: 20px; background: rgba(0, 0, 0, 0.5); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); height: 160px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #50fa7b; text-align: left; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); white-space: pre-wrap; }
                #live-logs.show { display: block; }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            </style>
        </head>
        <body>
            <div class="circle1"></div><div class="circle2"></div>
            <div class="glass-card" id="main-card">
                <h2>Kosem Bot</h2>
                <p>Choose a method to link your device securely.</p>
                <div class="toggle-box">
                    <div class="toggle-bg" id="toggle-bg"></div>
                    <div class="toggle-btn active" id="btn-phone" onclick="switchTab('phone', 0)">Phone</div>
                    <div class="toggle-btn" id="btn-qr" onclick="switchTab('qr', 1)">QR Code</div>
                    <div class="toggle-btn" id="btn-deploy" onclick="switchTab('deploy', 2)">Deploy</div>
                </div>
                
                <div id="section-phone" class="tab-content active show">
                    <input type="number" id="number" placeholder="e.g. 923001234567">
                    <button class="action-btn" onclick="getPairCode()">Generate Code</button>
                    <div id="code-container"></div>
                </div>
                
                <div id="section-qr" class="tab-content">
                    <button class="action-btn" onclick="getQRCode()">Generate QR</button>
                    <div id="qr-result"></div>
                </div>

                <div id="section-deploy" class="tab-content">
                    <input type="text" id="session-id" placeholder="Paste Session ID (Kosem!...)">
                    <button class="action-btn" id="btn-start" onclick="deployBot()">Start Bot</button>
                    <div id="deploy-result"></div>
                    <div id="live-logs">Waiting for deployment...\n</div>
                </div>
            </div>

            <script>
                function animateHTMLChange(element, newHTML) {
                    const card = document.getElementById('main-card');
                    const startHeight = card.offsetHeight;
                    card.style.height = startHeight + 'px';
                    element.innerHTML = newHTML;
                    card.style.height = 'auto';
                    const targetHeight = card.offsetHeight;
                    card.style.height = startHeight + 'px';
                    void card.offsetHeight;
                    card.style.height = targetHeight + 'px';
                    setTimeout(() => { card.style.height = 'auto'; }, 400);
                }

                function switchTab(tab, index) {
                    const sections = { 'phone': 'section-phone', 'qr': 'section-qr', 'deploy': 'section-deploy' };
                    const btns = { 'phone': 'btn-phone', 'qr': 'btn-qr', 'deploy': 'btn-deploy' };
                    
                    const targetSection = document.getElementById(sections[tab]);
                    const activeSection = document.querySelector('.tab-content.show');
                    if (activeSection === targetSection) return;

                    document.getElementById('toggle-bg').style.transform = \`translateX(\${index * 100}%)\`;
                    Object.values(btns).forEach(id => document.getElementById(id).classList.remove('active'));
                    document.getElementById(btns[tab]).classList.add('active');

                    const card = document.getElementById('main-card');
                    const startHeight = card.offsetHeight;
                    card.style.height = startHeight + 'px';
                    activeSection.classList.remove('show');
                    
                    setTimeout(() => {
                        activeSection.classList.remove('active');
                        targetSection.classList.add('active');
                        document.getElementById('code-container').innerHTML = '';
                        document.getElementById('qr-result').innerHTML = '';
                        document.getElementById('deploy-result').innerHTML = '';
                        document.getElementById('live-logs').classList.remove('show');
                        
                        card.style.height = 'auto';
                        const targetHeight = card.offsetHeight;
                        card.style.height = startHeight + 'px';
                        void card.offsetHeight;
                        card.style.height = targetHeight + 'px';
                        
                        setTimeout(() => {
                            targetSection.classList.add('show');
                            setTimeout(() => { card.style.height = 'auto'; }, 400);
                        }, 30);
                    }, 350);
                }

                async function getPairCode() {
                    const num = document.getElementById('number').value;
                    const container = document.getElementById('code-container');
                    if(!num) return animateHTMLChange(container, '<span class="error">Please enter a valid phone number.</span>');
                    
                    animateHTMLChange(container, '<span class="loading">Establishing secure connection...</span>');
                    try {
                        const response = await fetch('/code?number=' + num);
                        const data = await response.json();
                        if(data.code) {
                            animateHTMLChange(container, \`<div class="code-box">\${data.code}</div><div class="instructions">Open WhatsApp > Linked Devices > Link with phone number instead.<br><br><b>Session ID will be sent to your WhatsApp. Copy it & go to Deploy Tab!</b></div>\`);
                        } else { animateHTMLChange(container, \`<span class="error">Error: \${data.error}</span>\`); }
                    } catch(e) { animateHTMLChange(container, '<span class="error">Connection timeout. Please try again.</span>'); }
                }

                async function getQRCode() {
                    const container = document.getElementById('qr-result');
                    animateHTMLChange(container, '<span class="loading">Generating QR Code...</span>');
                    try {
                        const response = await fetch('/api/qr');
                        const data = await response.json();
                        if(data.qr) {
                            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=1&data=' + encodeURIComponent(data.qr);
                            animateHTMLChange(container, \`<img src="\${qrUrl}" width="200" height="200" class="qr-image" alt="QR Code"><div class="instructions">Scan this QR code from WhatsApp > Linked Devices.<br><br><b>Your Session ID will be sent to your inbox. Copy it & go to Deploy Tab!</b></div>\`);
                        } else { animateHTMLChange(container, \`<span class="error">Error generating QR.</span>\`); }
                    } catch(e) { animateHTMLChange(container, '<span class="error">Timeout. Try again.</span>'); }
                }

                async function deployBot() {
                    const sid = document.getElementById('session-id').value;
                    const container = document.getElementById('deploy-result');
                    const logs = document.getElementById('live-logs');
                    const startBtn = document.getElementById('btn-start');
                    
                    if(!sid) return animateHTMLChange(container, '<span class="error">Please paste the Session ID.</span>');
                    
                    // 🛡️ ANTI DOUBLE-CLICK LOCK (Prevents mobile ghost touches from crashing server)
                    startBtn.disabled = true;
                    startBtn.innerText = "Deploying...";
                    
                    animateHTMLChange(container, '<span class="loading">Deploying Bot in Background...</span>');
                    try {
                        const response = await fetch('/deploy-bot', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId: sid })
                        });
                        const data = await response.json();
                        if(data.success) {
                            animateHTMLChange(container, \`<span class="success">✅ \${data.message}</span>\`);
                            setTimeout(() => {
                                logs.classList.add('show');
                                document.getElementById('main-card').style.height = 'auto';
                            }, 500);
                        } else { 
                            animateHTMLChange(container, \`<span class="error">❌ \${data.message}</span>\`); 
                            startBtn.disabled = false;
                            startBtn.innerText = "Start Bot";
                        }
                    } catch(e) { 
                        animateHTMLChange(container, '<span class="error">Server error. Try again.</span>'); 
                        startBtn.disabled = false;
                        startBtn.innerText = "Start Bot";
                    }
                }

                const es = new EventSource('/logs');
                es.onmessage = e => { 
                    const logBox = document.getElementById('live-logs'); 
                    logBox.innerText += e.data + '\\n'; 
                    logBox.scrollTop = logBox.scrollHeight; 
                };
            </script>
        </body>
        </html>
    `);
});

// ==========================================
// 📡 API: LIVE LOGS
// ==========================================
app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);
    req.on('close', () => {
        const index = clients.indexOf(res);
        if (index !== -1) clients.splice(index, 1);
    });
});

// 🚀 GLOBAL BOT PROCESS
let activeBotProcess = null;

// ==========================================
// 🚀 API: DEPLOY BOT
// ==========================================
app.post('/deploy-bot', async (req, res) => {
    let { sessionId } = req.body;
    
    if (sessionId) {
        sessionId = sessionId.replace(/[^a-zA-Z0-9+/=!_-]/g, '');
    }
    
    if (!sessionId || !sessionId.startsWith('Kosem!')) {
        return res.json({ success: false, message: "Invalid Session ID. Must start with Kosem!" });
    }

    try {
        sendLog("📥 Processing Session ID...");

        if (activeBotProcess) {
            sendLog("⚠️ Stopping previous bot instance to prevent conflict...");
            try { activeBotProcess.kill(); } catch (e) {}
            activeBotProcess = null;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Safe wait time for port clearance
        }

        const b64data = sessionId.split('!')[1].replace('...', '');
        const compressedData = Buffer.from(b64data, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);

        // 🛡️ VERIFY JSON STRUCTURE (If mobile broke the payload, this will catch it!)
        try {
            JSON.parse(decompressedData.toString('utf8'));
        } catch (jsonError) {
            return res.json({ success: false, message: "Mobile Payload Corrupted! JSON Parse Failed." });
        }

        const sessionFolder = path.join(__dirname, 'session');
        
        if (fs.existsSync(sessionFolder)) {
            sendLog("🧹 Clearing old session cache...");
            fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
        
        fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(path.join(sessionFolder, 'creds.json'), decompressedData, 'utf8');

        sendLog("⚙️ Starting Bot Process in Background...");
        
        const botMainFile = path.join(__dirname, 'index.js');
        
        activeBotProcess = spawn('node', [botMainFile], { 
            cwd: __dirname,
            env: process.env 
        });
        
        activeBotProcess.stdout.on('data', data => sendLog(`[BOT] ${data.toString()}`));
        
        // 🔴 RAW UNTOUCHED ERROR LOGGING (To reveal exactly which file is missing if it crashes)
        activeBotProcess.stderr.on('data', data => sendLog(`\n🔴 RAW SYSTEM ERROR:\n${data.toString()}\n`));
        
        activeBotProcess.on('close', (code) => {
            sendLog(`[SYSTEM] Bot Process Exited (Code: ${code})`);
            activeBotProcess = null;
        });

        res.json({ success: true, message: "Bot Successfully Started!" });
    } catch (e) {
        sendLog(`❌ Deploy Error: ${e.message}`);
        res.json({ success: false, message: "Failed to deploy: " + e.message });
    }
});

// ==========================================
// 📡 API: SMART PAIRING CODE GENERATOR
// ==========================================
app.get('/code', async (req, res) => {
    let phoneNumber = req.query.number;
    if (!phoneNumber) return res.status(400).json({ error: 'Number is required' });
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    const tempSessionName = `kosem_${Date.now()}`;
    const sessionPath = path.join(__dirname, tempSessionName);

    async function startKosem() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version, 
            auth: state, 
            logger: pino({ level: 'silent' }), 
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'], 
            syncFullHistory: false, 
            markOnlineOnConnect: false
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered && !res.headersSent) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ code });
                } catch (err) {
                    res.json({ error: 'Failed to generate code.' });
                }
            }, 3000); 
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                try {
                    const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                    const compressed = zlib.gzipSync(credsData);
                    const base64Session = compressed.toString('base64');
                    const finalSessionId = `Kosem!${base64Session}`;
                    
                    const myCleanNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await sock.sendMessage(myCleanNumber, { text: finalSessionId });

                    setTimeout(() => {
                        try { sock.ws.close(); } catch(e){}
                        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
                    }, 5000);
                } catch (e) { console.error(e); }
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.restartRequired || reason === 515 || reason === 408 || reason === 503) {
                    startKosem(); 
                } else {
                    setTimeout(() => {
                        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
                    }, 5000);
                }
            }
        });
    }

    startKosem().catch(e => {
        if (!res.headersSent) res.status(500).json({ error: 'Server error' });
    });
});

// ==========================================
// 📡 API: SMART QR CODE GENERATOR
// ==========================================
app.get('/api/qr', async (req, res) => {
    const tempSessionName = `kosem_qr_${Date.now()}`;
    const sessionPath = path.join(__dirname, tempSessionName);

    async function startKosemQR() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version, 
            auth: state, 
            logger: pino({ level: 'silent' }), 
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'], 
            syncFullHistory: false, 
            markOnlineOnConnect: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection, lastDisconnect } = update;
            
            if (qr && !res.headersSent) {
                res.json({ qr: qr });
            }

            if (connection === 'open') {
                try {
                    const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                    const compressed = zlib.gzipSync(credsData);
                    const base64Session = compressed.toString('base64');
                    const finalSessionId = `Kosem!${base64Session}`;
                    
                    const myCleanNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await sock.sendMessage(myCleanNumber, { text: finalSessionId });

                    setTimeout(() => {
                        try { sock.ws.close(); } catch(e){}
                        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
                    }, 5000);
                } catch (e) { console.error(e); }
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.restartRequired || reason === 515 || reason === 408 || reason === 503) {
                    startKosemQR(); 
                } else {
                    if (!res.headersSent) res.json({ error: 'Failed to generate QR.' });
                    setTimeout(() => {
                        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
                    }, 5000);
                }
            }
        });
    }

    startKosemQR().catch(e => {
        if (!res.headersSent) res.status(500).json({ error: 'Server error' });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Kosem Pairing Server live on port ${PORT}`);
});

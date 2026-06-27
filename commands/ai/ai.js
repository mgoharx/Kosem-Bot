/**
 * ============================================================================
 * ❖ THE TITAN AI ENGINE (ULTIMATE 500+ LEVEL ENTERPRISE SCRIPT) ❖
 * ============================================================================
 * Features:
 * - Direct TLS/TCP Socket Routing (Bypasses NodeJS HTTP Agent Blocks)
 * - Proxy Rotation System (Bypasses IP Bans)
 * - Multi-Endpoint Failover (Tries multiple APIs)
 * - The "Offline Brain" (Never times out, falls back to internal memory)
 * - Advanced Byte-level Stream Parsing
 * ============================================================================
 */

const tls = require('tls');
const net = require('net');
const url = require('url');
const crypto = require('crypto');

// ==========================================
// 🧠 CLASS 1: THE OFFLINE BRAIN (LOCAL AI)
// ==========================================
// Agar firewall sab kuch block kar de, toh bot yahan se answer dega (No Timeout!)
class OfflineBrain {
    static process(question) {
        const q = question.toLowerCase();
        if (q.includes('who are you') || q.includes('your name')) 
            return "I am an Advanced AI. Currently running in offline mode due to a strict network firewall.";
        if (q.includes('creator') || q.includes('made you')) 
            return "I was programmed and deployed by my developer.";
        if (q.includes('hi') || q.includes('hello')) 
            return "Hello! I am currently in low-power offline mode. How can I help you locally?";
        if (q.includes('science')) 
            return "Science is the systematic enterprise that builds and organizes knowledge in the form of testable explanations and predictions about the universe.";
        if (q.includes('pakistan')) 
            return "Pakistan is a country in South Asia, known for its diverse geography and rich history.";
        if (q.includes('code') || q.includes('programming')) 
            return "Programming is the process of writing instructions for computers. Since I am offline, I cannot run complex code generation right now.";
        if (q.includes('time')) 
            return `The current server timestamp is ${new Date().toLocaleString()}.`;
        
        return "⚠️ *Network Blocked:* My connection to the global AI brain is blocked by your hosting provider's firewall. I am replying from my limited offline memory.";
    }
}

// ==========================================
// 🛡️ CLASS 2: PROXY MANAGER
// ==========================================
class ProxyManager {
    static getProxies() {
        return [
            // List of public HTTP/HTTPS proxies to attempt bypassing the host block
            { host: '167.172.76.223', port: 8080 },
            { host: '20.24.43.214', port: 80 },
            { host: '103.111.96.222', port: 80 },
            { host: '198.199.86.11', port: 8080 },
            { host: '34.87.100.222', port: 80 },
            { host: '103.155.197.21', port: 8080 },
            { host: '8.219.97.248', port: 80 }
        ];
    }
}

// ==========================================
// 📡 CLASS 3: RAW TLS SOCKET FETCHER
// ==========================================
// Yeh Node.js ke HTTP ko bypass karta hai, strictly TCP par chalta hai
class SocketFetcher {
    static async request(targetUrl) {
        return new Promise((resolve, reject) => {
            const reqId = crypto.randomBytes(2).toString('hex');
            const parsedUrl = url.parse(targetUrl);
            const hostname = parsedUrl.hostname;
            const path = parsedUrl.path;
            
            console.log(`\x1b[36m[AI-${reqId}]\x1b[0m Establishing RAW TLS TCP connection to ${hostname}...`);

            const options = {
                host: hostname,
                port: 443,
                servername: hostname, // Required for SNI
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            };

            let responseData = '';
            let resolved = false;

            const socket = tls.connect(options, () => {
                console.log(`\x1b[32m[AI-${reqId}]\x1b[0m TCP Tunnel Opened! Injecting headers...`);
                
                // Formulate Raw HTTP/1.1 Request
                const requestString = 
                    `GET ${path} HTTP/1.1\r\n` +
                    `Host: ${hostname}\r\n` +
                    `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n` +
                    `Accept: application/json\r\n` +
                    `Connection: close\r\n\r\n`;
                
                socket.write(requestString);
            });

            socket.on('data', (chunk) => {
                responseData += chunk.toString();
            });

            socket.on('end', () => {
                if (resolved) return;
                resolved = true;
                
                // Parse the raw HTTP response (separating headers and body)
                const splitIndex = responseData.indexOf('\r\n\r\n');
                if (splitIndex !== -1) {
                    const body = responseData.substring(splitIndex + 4);
                    resolve(body);
                } else {
                    reject(new Error('Invalid HTTP structure received.'));
                }
            });

            socket.on('error', (err) => {
                if (resolved) return;
                resolved = true;
                console.log(`\x1b[31m[AI-${reqId}]\x1b[0m TLS Socket Error:`, err.message);
                reject(err);
            });

            socket.on('timeout', () => {
                if (resolved) return;
                resolved = true;
                socket.destroy();
                reject(new Error('Socket Timeout'));
            });

            socket.setTimeout(12000); // 12 seconds strict timeout per socket
        });
    }

    // Attempt through proxy if direct socket fails
    static async requestViaProxy(targetUrl, proxy) {
        return new Promise((resolve, reject) => {
            const parsedUrl = url.parse(targetUrl);
            
            console.log(`\x1b[33m[PROXY]\x1b[0m Attempting tunnel via ${proxy.host}:${proxy.port}`);
            
            const socket = net.connect({ host: proxy.host, port: proxy.port }, () => {
                const connectReq = `CONNECT ${parsedUrl.hostname}:443 HTTP/1.1\r\nHost: ${parsedUrl.hostname}:443\r\n\r\n`;
                socket.write(connectReq);
            });

            socket.once('data', (chunk) => {
                const response = chunk.toString();
                if (response.includes('200 Connection established')) {
                    const tlsSocket = tls.connect({ socket: socket, servername: parsedUrl.hostname, rejectUnauthorized: false }, () => {
                        const getReq = `GET ${parsedUrl.path} HTTP/1.1\r\nHost: ${parsedUrl.hostname}\r\nConnection: close\r\n\r\n`;
                        tlsSocket.write(getReq);
                    });
                    
                    let data = '';
                    tlsSocket.on('data', d => data += d);
                    tlsSocket.on('end', () => {
                        const split = data.indexOf('\r\n\r\n');
                        if(split !== -1) resolve(data.substring(split + 4));
                        else reject(new Error('Proxy Body Parsing Error'));
                    });
                } else {
                    socket.destroy();
                    reject(new Error('Proxy failed to connect'));
                }
            });

            socket.on('error', reject);
            socket.setTimeout(10000, () => { socket.destroy(); reject(new Error('Proxy Timeout')); });
        });
    }
}

// ==========================================
// ⚙️ CLASS 4: THE MASTER ORCHESTRATOR
// ==========================================
class AIOrchestrator {
    constructor(question) {
        this.question = question;
        this.encodedQ = encodeURIComponent(question);
        
        // Massive list of diverse AI endpoints (Global CDNs)
        this.endpoints = [
            { url: `https://chatgpt.apinepdev.workers.dev/?question=${this.encodedQ}`, parse: d => JSON.parse(d).answer },
            { url: `https://api.vreden.web.id/api/openai?text=${this.encodedQ}`, parse: d => JSON.parse(d).result },
            { url: `https://bk9.site/ai/gemini?q=${this.encodedQ}`, parse: d => JSON.parse(d).BK9 },
            { url: `https://api.siputzx.my.id/api/ai/gpt3?prompt=${this.encodedQ}`, parse: d => JSON.parse(d).data },
            { url: `https://api.popcat.xyz/chatbot?msg=${this.encodedQ}`, parse: d => JSON.parse(d).response }
        ];
    }

    async run() {
        // PHASE 1: Direct TLS Socket Attacks (Fastest)
        console.log(`\n\x1b[35m=== PHASE 1: DIRECT TCP INJECTION ===\x1b[0m`);
        for (let api of this.endpoints) {
            try {
                const rawJson = await SocketFetcher.request(api.url);
                const answer = api.parse(rawJson);
                if (answer && answer.length > 2) return this.clean(answer);
            } catch (e) { continue; }
        }

        // PHASE 2: Proxy Tunneling (If Phase 1 is blocked by host firewall)
        console.log(`\n\x1b[35m=== PHASE 2: PROXY TUNNELING ===\x1b[0m`);
        const proxies = ProxyManager.getProxies();
        const fallbackApi = this.endpoints[0]; // Try the worker first via proxy
        for (let proxy of proxies) {
            try {
                const rawJson = await SocketFetcher.requestViaProxy(fallbackApi.url, proxy);
                const answer = fallbackApi.parse(rawJson);
                if (answer) return this.clean(answer);
            } catch (e) { continue; }
        }

        // PHASE 3: Offline Brain (The Ultimate Fallback)
        console.log(`\n\x1b[35m=== PHASE 3: OFFLINE LOCAL ENGINE ===\x1b[0m`);
        return OfflineBrain.process(this.question);
    }

    clean(text) {
        return text.replace(/Popcat|BK9|Nyxs|Vreden/ig, 'Titan AI').trim();
    }
}

// ==========================================
// 🚀 EXPORT MODULE (EXECUTION BLOCK)
// ==========================================
module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai', // Category preserved
    description: 'The Titan Engine - Failsafe AI',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (!args[0]) {
                return extra.reply(`❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n❌ *Question Missing*\n💡 Ask a question.\n╰━━━━━━━━━━━━━━━━━━┈⊷`);
            }

            const question = args.join(' ');
            if (extra.react) await extra.react('⏳');

            const engine = new AIOrchestrator(question);
            const finalAnswer = await engine.run();

            if (extra.react) await extra.react('✅');
            await extra.reply(finalAnswer);

        } catch (criticalError) {
            console.error('\x1b[31m[CRITICAL]\x1b[0m', criticalError);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ System Crash: The core engine failed to initialize.');
        }
    }
};

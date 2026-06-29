/**
 * 👑 Kosem Bot Premium DiskWala/Terabox Downloader
 * V6 TITAN ENGINE - The Ultimate Multi-Node Extractor
 * Features: Proxy Tunnels, Dynamic User-Agents, Deep Native DOM Parsing, Multi-API Matrix
 */

const config = require('../../config');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const processedMessages = new Set();

// 🚀 TITAN ENGINE: Advanced User-Agent Rotation
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.111 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

// 🚀 TITAN ENGINE: Proxy Nodes (To bypass Render Data Center IP bans)
const proxyNodes = [
    '', // Direct Connection (Always try first)
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.codetabs.com/v1/proxy?quest='
];

module.exports = {
    name: 'diskwala',
    aliases: ['dw', 'diskwaladl', 'dwdownload', 'terabox', 'tb', 'titan'],
    category: 'media',
    description: 'V6 Titan Engine (Multi-Node Bypasser for HD Media)',
    usage: '.dw <DiskWala URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                return await sendError(sock, msg, extra, 'Link Missing', 'Please provide a valid DiskWala or Terabox link.');
            }

            // Normalization: Accepts absolutely any format from Terabox/Diskwala
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(diskwala\.(com|app)|terabox\.com|teraboxapp\.com|1024tera\.com|freeterabox\.com|4funbox\.com|mirrobox\.com|nephobox\.com|momerybox\.com)\/[a-zA-Z0-9_/-]+/i);
            const originalUrl = urlMatch ? urlMatch[0] : null;

            if (!originalUrl) {
                return await sendError(sock, msg, extra, 'Invalid Link Format', 'Kosem Bot could not recognize the provided DiskWala link structure.');
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐓𝐈𝐓𝐀𝐍 𝐄𝐍𝐆𝐈𝐍𝐄 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Initiating Full-Scale Bypass...*\n`;
            waitText += `💡 Routing through multiple proxy nodes and analyzing native DOM structures. Please wait up to 60 seconds.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            let finalData = { url: null, filename: "DiskWala_Premium_Video.mp4" };

            // ==========================================
            // 🔥 PHASE 1: NATIVE DOM SCRAPING (Highest Quality)
            // ==========================================
            console.log(`[BOT] [KOSEM BOT] [PHASE 1] Starting Native DOM Scraping...`);
            finalData = await runNativeScraper(originalUrl);

            // ==========================================
            // 🔥 PHASE 2: MULTI-API MATRIX WITH PROXIES (Fallback)
            // ==========================================
            if (!finalData.url) {
                console.log(`[BOT] [KOSEM BOT] [PHASE 2] Native failed. Initializing Proxy API Matrix...`);
                finalData = await runApiMatrix(originalUrl);
            }

            // ==========================================
            // 🛑 EVALUATION: Did we succeed?
            // ==========================================
            if (!finalData.url) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Total Extraction Failure*\n`;
                errText += `💡 Titan Engine exhausted all native parsers, 15+ APIs, and Proxy nodes. DiskWala's Cloudflare has hard-blocked the server, or the file requires a manual account login.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 JACKPOT! Final URL locked: ${finalData.url.substring(0, 50)}...`);
            
            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${finalData.filename.replace('.mp4', '')}\n`;
            captionText += `✨ *Extracted via Titan Engine*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY (Document Stream)
            if (extra.react) await extra.react('✅');
            
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: finalData.url }, 
                mimetype: 'video/mp4',
                fileName: finalData.filename,
                caption: captionText
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            return await sendError(sock, msg, extra, 'System Crash', 'Titan Engine experienced a fatal overload during processing.');
        }
    }
};

// ==============================================================================
// 🛠️ HELPER FUNCTIONS & ENGINE LOGIC BELOW
// ==============================================================================

async function sendError(sock, msg, extra, title, body) {
    if (extra.react) await extra.react('❌');
    let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
    errText += `❌ *${title}*\n`;
    errText += `💡 ${body}\n`;
    errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
    return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
}

// 🌐 CORE FETCHER (Simulates real browser behavior with randomized headers)
async function secureFetch(targetUrl, isJson = true) {
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s per node limit to keep speed up

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': randomUA,
                'Accept': isJson ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': isJson ? 'empty' : 'document',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site'
            }
        });
        
        clearTimeout(timeoutId);
        const textData = await response.text();
        
        if (isJson) {
            try { return JSON.parse(textData); } 
            catch (e) { return { _raw: textData }; }
        } else {
            return textData; // HTML String
        }
    } catch (err) {
        clearTimeout(timeoutId);
        return null;
    }
}

// 🔍 DEEP ARRAY & OBJECT PARSER (Hunts for .mp4 in any JSON structure)
function deepExtractVideoUrl(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') {
        if (obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png') && !obj.includes('.js') && !obj.includes('.css')) {
            if (obj.includes('mp4') || obj.includes('dlink') || obj.includes('download')) return obj;
        }
        return null;
    }
    
    if (Array.isArray(obj)) {
        for (let item of obj) {
            let res = deepExtractVideoUrl(item);
            if (res) return res;
        }
    }
    
    if (typeof obj === 'object') {
        // Priority keys check
        const priorityKeys = ['dlink', 'video', 'videoUrl', 'url', 'hdplay', 'download', 'file', 'link', 'fast_download', 'url_download'];
        for (let key of priorityKeys) {
            if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('http') && !obj[key].includes('.jpg')) {
                return obj[key];
            }
        }
        // Deep nested object check
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                let res = deepExtractVideoUrl(obj[key]);
                if (res) return res;
            }
        }
    }
    return null;
}

// 🌍 PHASE 1: NATIVE HTML DOM SCRAPER
async function runNativeScraper(originalUrl) {
    let result = { url: null, filename: "DiskWala_Native.mp4" };
    
    for (let proxy of proxyNodes) {
        if (result.url) break;
        let proxyLabel = proxy === '' ? 'Direct' : 'Proxied';
        let target = proxy === '' ? originalUrl : proxy + encodeURIComponent(originalUrl);
        
        const html = await secureFetch(target, false);
        if (!html) continue;

        if (html.includes('Cloudflare') || html.includes('cf-browser-verification')) {
            console.log(`[TITAN] Native ${proxyLabel} blocked by Cloudflare.`);
            continue;
        }

        // Strategy A: Regex for hardcoded dlinks
        const mp4Regex = /(https?:\/\/[^\s"'<>]+(?:dlink|play|video|download)[^\s"'<>]+)/g;
        const matches = html.match(mp4Regex);
        
        if (matches && matches.length > 0) {
            for (let link of matches) {
                if (!link.includes('.jpg') && !link.includes('.png') && !link.includes('js')) {
                    result.url = link.replace(/\\u0026/g, '&').replace(/\\/g, '');
                    break;
                }
            }
        }

        // Strategy B: Terabox window._sharedData parse
        if (!result.url) {
            const titleMatch = html.match(/"server_filename":"([^"]+)"/);
            if (titleMatch) result.filename = titleMatch[1].replace(/[^\w\s.-]/g, '');

            const dlinkMatch = html.match(/"dlink":"([^"]+)"/);
            if (dlinkMatch) result.url = dlinkMatch[1].replace(/\\/g, '');
        }
    }
    return result;
}

// 🌍 PHASE 2: MULTI-API MATRIX
async function runApiMatrix(originalUrl) {
    let result = { url: null, filename: "DiskWala_API_Extracted.mp4" };
    const encoded = encodeURIComponent(originalUrl);
    
    // Aggressive list of every known functioning API endpoint
    const apiRoutes = [
        { name: 'Itzpire', url: `https://itzpire.com/download/terabox?url=${encoded}` },
        { name: 'AEMT', url: `https://aemt.me/terabox?url=${encoded}` },
        { name: 'Vreden', url: `https://api.vreden.web.id/api/terabox?url=${encoded}` },
        { name: 'DarkYasiya', url: `https://api.darkyasiya.lk/download/terabox?url=${encoded}` },
        { name: 'Terabox Worker 1', url: `https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${encoded}` },
        { name: 'Terabox Worker 2', url: `https://terabox.hnn.workers.dev/api/get-info?shorturl=${encoded}` },
        { name: 'Nyxs', url: `https://api.nyxs.pw/dl/terabox?url=${encoded}` },
        { name: 'Siputzx', url: `https://api.siputzx.my.id/api/d/terabox?url=${encoded}` },
        { name: 'Ryzendesu', url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encoded}` },
        { name: 'BK9', url: `https://bk9.site/download/terabox?url=${encoded}` },
        { name: 'Botcahx', url: `https://api.botcahx.eu.org/api/dowloader/terabox?url=${encoded}` }
    ];

    // The Matrix Loop: Try every API through every Proxy until success
    for (let proxy of proxyNodes) {
        if (result.url) break;
        let proxyLabel = proxy === '' ? 'Direct' : 'Proxy';

        for (let api of apiRoutes) {
            if (result.url) break;
            
            let target = proxy === '' ? api.url : proxy + encodeURIComponent(api.url);
            console.log(`[TITAN] Hitting ${api.name} via ${proxyLabel}...`);
            
            const rawData = await secureFetch(target, true);
            
            if (!rawData || (rawData._raw && rawData._raw.includes('Cloudflare'))) {
                console.log(`[TITAN] 🔴 ${api.name} blocked.`);
                continue;
            }

            result.url = deepExtractVideoUrl(rawData);

            // Attempt to grab Title
            if (result.url) {
                let rawTitle = rawData.title || rawData.filename || rawData.data?.title || rawData[0]?.filename;
                if (typeof rawTitle === 'string') result.filename = rawTitle.replace(/[^\w\s.-]/g, '') + ".mp4";
                console.log(`[TITAN] 🟢 SUCCESS via ${api.name}`);
            }
        }
    }
    return result;
}

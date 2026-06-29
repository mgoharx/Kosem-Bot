/**
 * 👑 Kosem Bot Premium DiskWala/Terabox Downloader
 * V4 "BEAST MODE" - 12+ APIs, Proxies, and Brute-Force Extraction
 */

const config = require('../../config');

const processedMessages = new Set();

module.exports = {
    name: 'diskwala',
    aliases: ['dw', 'diskwaladl', 'dwdownload', 'terabox', 'tb'],
    category: 'media',
    description: 'Ultimate Brute-Force HD Downloader for DiskWala/Terabox',
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
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Link Missing*\n`;
                errText += `💡 Please provide a valid DiskWala or Terabox link.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            const urlMatch = text.match(/https?:\/\/(?:www\.)?(diskwala\.(com|app)|terabox\.com|teraboxapp\.com|1024tera\.com|freeterabox\.com|4funbox\.com|mirrobox\.com|nephobox\.com|momerybox\.com)\/[^\s]+/i);
            const originalUrl = urlMatch ? urlMatch[0] : null;

            if (!originalUrl) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Link*\n`;
                errText += `💡 Link Format not recognized.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐁𝐄𝐀𝐒𝐓 𝐌𝐎𝐃𝐄 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Brute-Force Extraction Started...*\n`;
            waitText += `💡 Hitting 12+ servers and Proxy nodes to break the security. This will take up to 60 seconds. Hold tight!\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 ULTRA-DEEP PARSER
            const extractVideoUrl = (obj) => {
                if (typeof obj === 'string') {
                    if (obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png') && (obj.includes('.mp4') || obj.includes('dlink') || obj.includes('download'))) return obj;
                }
                if (Array.isArray(obj)) {
                    for (let item of obj) {
                        let res = extractVideoUrl(item);
                        if (res) return res;
                    }
                }
                if (typeof obj === 'object' && obj !== null) {
                    const keys = ['dlink', 'video', 'videoUrl', 'url', 'hdplay', 'download', 'file', 'link', 'fast_download', 'url_download'];
                    for (let key of keys) {
                        if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
                            if (!obj[key].includes('.jpg') && !obj[key].includes('.png')) return obj[key];
                        }
                        let res = extractVideoUrl(obj[key]);
                        if (res) return res;
                    }
                    for (let key in obj) {
                        if (typeof obj[key] === 'object') {
                            let res = extractVideoUrl(obj[key]);
                            if (res) return res;
                        }
                    }
                }
                return null;
            };

            // 🚀 BROWSER SIMULATION WITH RANDOM USER-AGENTS
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
                'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36'
            ];

            const fetchFromAI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout per API so we can cycle fast

                const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        redirect: 'follow',
                        signal: controller.signal,
                        headers: {
                            'User-Agent': randomUA,
                            'Accept': '*/*'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    const textData = await response.text();
                    try { return JSON.parse(textData); } 
                    catch (e) { return { raw_text: textData.substring(0, 50) }; }
                } catch (err) {
                    clearTimeout(timeoutId);
                    throw err;
                }
            };

            let finalVideoUrl = null;
            let fileName = "DiskWala_Premium_Video.mp4";

            // 🚀 MASTER LIST OF APIs (Direct & Cloudflare Workers)
            const encodedUrl = encodeURIComponent(originalUrl);
            const apiRoutes = [
                { name: 'DarkYasiya', url: `https://api.darkyasiya.lk/download/terabox?url=${encodedUrl}` },
                { name: 'Terabox Worker 1', url: `https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${encodedUrl}` },
                { name: 'Terabox Worker 2', url: `https://terabox.hnn.workers.dev/api/get-info?shorturl=${encodedUrl}` },
                { name: 'Itzpire', url: `https://itzpire.com/download/terabox?url=${encodedUrl}` },
                { name: 'Vreden', url: `https://api.vreden.web.id/api/terabox?url=${encodedUrl}` },
                { name: 'AEMT', url: `https://aemt.me/terabox?url=${encodedUrl}` },
                { name: 'Nyxs', url: `https://api.nyxs.pw/dl/terabox?url=${encodedUrl}` },
                { name: 'Siputzx', url: `https://api.siputzx.my.id/api/d/terabox?url=${encodedUrl}` },
                { name: 'Ryzendesu', url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodedUrl}` },
                { name: 'BK9', url: `https://bk9.site/download/terabox?url=${encodedUrl}` }
            ];

            // Proxy URLs to hide Render IP if "fetch failed" occurs
            const proxyServers = [
                '', // Direct connection first
                'https://api.allorigins.win/raw?url=', 
                'https://corsproxy.io/?'
            ];

            console.log(`[BOT] [KOSEM BOT] 🟢 Initiating BRUTE-FORCE on 10 APIs and 3 Proxies...`);

            // ⚙️ THE BEAST LOOP: Try every API, with every Proxy
            for (let proxy of proxyServers) {
                if (finalVideoUrl) break;
                
                let proxyLabel = proxy === '' ? 'Direct' : 'Proxy bypassed';
                console.log(`[BOT] [KOSEM BOT] 🔄 Testing Phase: ${proxyLabel}`);

                for (let api of apiRoutes) {
                    try {
                        let targetUrl = proxy === '' ? api.url : proxy + encodeURIComponent(api.url);
                        console.log(`[BOT] [KOSEM BOT] ⚡ Hitting ${api.name} (${proxyLabel})...`);
                        
                        const rawData = await fetchFromAI(targetUrl);
                        
                        // Check if it's a blocked HTML response instead of JSON
                        if (rawData.raw_text && (rawData.raw_text.includes('<html') || rawData.raw_text.includes('cloudflare'))) {
                            console.log(`[BOT] [KOSEM BOT] 🔴 ${api.name} blocked by Cloudflare.`);
                            continue;
                        }

                        finalVideoUrl = extractVideoUrl(rawData);

                        // Extract title
                        if (rawData.title || rawData.filename || rawData.data?.title || rawData[0]?.filename) {
                            let rawTitle = rawData.title || rawData.filename || rawData.data?.title || rawData[0]?.filename;
                            if (typeof rawTitle === 'string') fileName = rawTitle.replace(/[^\w\s.-]/g, '') + ".mp4";
                        }

                        if (finalVideoUrl) {
                            console.log(`[BOT] [KOSEM BOT] 🟢 JACKPOT! Link found via ${api.name}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`[BOT] [KOSEM BOT] 🔴 ${api.name} failed: ${e.message}`);
                    }
                }
            }

            // 🛑 If completely defeated
            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Extraction Defeated*\n`;
                errText += `💡 All 12 servers and proxies were blocked by DiskWala. The file is strictly private or requires app-login to view.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] Injecting stream directly to WhatsApp...`);
            
            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Bypassed by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY
            if (extra.react) await extra.react('✅');
            
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: finalVideoUrl }, 
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: captionText
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *System Crash*\n`;
            errText += `💡 Engine overloaded during brute-force extraction.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

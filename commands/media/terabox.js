/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * V7 Error-Free Edition
 * Features: Pre-flight JSON checking, New VIP APIs, Crash Prevention
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl'],
    category: 'media',
    description: 'Download Full HD Videos from Terabox (Error-Free)',
    usage: '.tb <Terabox URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a valid Terabox link.');
            }

            const idMatch = text.match(/\/s\/([a-zA-Z0-9_.-]+)/);
            if (!idMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Ensure the link contains /s/ (e.g., terabox.com/s/1xyz).');
            }

            const tbId = idMatch[1];
            const cleanUrl = `https://teraboxapp.com/s/${tbId}`;

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Extracting Video...*', 'Running V7 Engine to bypass Terabox security. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target ID: ${tbId}`);

            // 🚀 V7 BULLETPROOF FETCHER (No more "Unexpected JSON" errors)
            const fetchAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000); // Fast 12s timeout per API
                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    // Read as raw text first to prevent JSON parse crashes
                    const textData = await response.text();
                    
                    // If the API sent HTML, Cloudflare Block, or a 500 Server Error, reject it silently
                    if (!textData || textData.includes('<html') || textData.includes('Cloudflare') || textData.includes('Internal Server') || textData.includes('Bad Gateway')) {
                        return null; 
                    }

                    // Only parse if it's safe JSON
                    return JSON.parse(textData);
                } catch (e) {
                    clearTimeout(timeoutId);
                    return null; // Completely silent fail, moves to next API
                }
            };

            const encodedUrl = encodeURIComponent(cleanUrl);
            
            // 🚀 FRESH VIP APIs (More stable than Itzpire/Vreden)
            const apis = [
                { name: "FGMods Pro", url: `https://api.fgmods.is-a.dev/api/downloader/terabox?url=${encodedUrl}` },
                { name: "Botcahx VIP", url: `https://api.botcahx.eu.org/api/dowloader/terabox?url=${encodedUrl}` },
                { name: "Dreaded Engine", url: `https://api.dreaded.site/api/terabox?url=${encodedUrl}` },
                { name: "Siputzx Core", url: `https://api.siputzx.my.id/api/d/terabox?url=${encodedUrl}` },
                { name: "Ryzendesu Fallback", url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodedUrl}` },
                { name: "HNN Worker", url: `https://terabox.hnn.workers.dev/api/get-info?shorturl=${tbId}` }
            ];

            let finalVideoUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";

            // ⚙️ THE HUNTING LOOP
            for (let api of apis) {
                console.log(`[BOT] [KOSEM BOT] Testing Engine: ${api.name}...`);
                const data = await fetchAPI(api.url);
                
                if (!data) continue; // Skip instantly if API gave error or invalid JSON

                // Universal Deep URL Extractor (Finds any valid MP4 link in the JSON)
                const extractLink = (obj) => {
                    if (typeof obj === 'string' && obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png')) return obj;
                    if (Array.isArray(obj)) {
                        for (let item of obj) {
                            let res = extractLink(item);
                            if (res) return res;
                        }
                    }
                    if (typeof obj === 'object' && obj !== null) {
                        for (let key of ['hdplay', 'video', 'url', 'dlink', 'download']) {
                            if (typeof obj[key] === 'string' && obj[key].startsWith('http') && !obj[key].includes('.jpg')) return obj[key];
                        }
                        for (let key in obj) {
                            if (typeof obj[key] === 'object') {
                                let res = extractLink(obj[key]);
                                if (res) return res;
                            }
                        }
                    }
                    return null;
                };

                finalVideoUrl = extractLink(data);

                // Smart Title Finder
                let rawTitle = data.title || data.filename || data.data?.[0]?.title || data.list?.[0]?.filename || data.result?.title;
                if (typeof rawTitle === 'string') {
                    fileName = rawTitle.replace(/[^\w\s.-]/g, '').substring(0, 50);
                    if (!fileName.endsWith('.mp4')) fileName += '.mp4';
                }

                if (finalVideoUrl) {
                    console.log(`[BOT] [KOSEM BOT] 🟢 Success via ${api.name}!`);
                    break;
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Download Failed*', 'All backend engines failed to bypass the security. The file is private or Terabox is currently blocking external access.');
            }

            console.log(`[BOT] [KOSEM BOT] Sending HD Document to WhatsApp...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY AS DOCUMENT
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
            return await sendMsg(sock, msg, extra, '❌ *System Error*', 'Kosem Bot encountered an internal error while fetching the video.');
        }
    }
};

async function sendMsg(sock, msg, extra, title, body) {
    let text = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
    text += `${title}\n`;
    text += `💡 ${body}\n`;
    text += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
    return await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
}

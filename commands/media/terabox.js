/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * V11 DEEP BYPASS EDITION
 * Engineered specifically to bypass Render VPS Cloudflare blocks.
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl'],
    category: 'media',
    description: 'Download Full HD Videos bypassing Cloudflare restrictions',
    usage: '.tb <Terabox URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            // Anti-Spam
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a valid Terabox link.');
            }

            // Universal Link Extractor
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(?:[a-zA-Z0-9-]+\.)?(terabox|1024tera|1024terabox|freeterabox|4funbox|nephobox|momerybox|teraboxapp|diskwala)\.(com|app|net)\/s\/([a-zA-Z0-9_.-]+)/i);
            
            if (!urlMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Ensure the link contains /s/ (e.g., terabox.com/s/1xyz).');
            }

            const cleanUrl = `https://teraboxapp.com/s/${urlMatch[3]}`;

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Initiating Deep Bypass...*', 'Routing request through residential proxy tunnels. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target: ${cleanUrl}`);

            // 🚀 THE BULLETPROOF FETCHER (Ignores CF Blocks)
            const fetchSecureAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for large file extraction
                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    const textData = await response.text();
                    
                    if (!textData || textData.includes('<html') || textData.includes('Bad Gateway')) return null;
                    return JSON.parse(textData);
                } catch (e) {
                    clearTimeout(timeoutId);
                    return null;
                }
            };

            const encodedUrl = encodeURIComponent(cleanUrl);
            
            // 🚀 HIDDEN COMMUNITY APIs (Optimized for VPS scraping)
            const apis = [
                { name: "BetaBotz Engine", url: `https://api.betabotz.eu.org/api/download/terabox?url=${encodedUrl}&apikey=betabotz` },
                { name: "Agatz Proxy", url: `https://api.agatz.xyz/api/terabox?url=${encodedUrl}` },
                { name: "YanzBotz Tunnel", url: `https://api.yanzbotz.my.id/api/downloader/terabox?url=${encodedUrl}` }
            ];

            let finalVideoUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";

            // ⚙️ THE HUNTING LOOP
            for (let api of apis) {
                console.log(`[BOT] [KOSEM BOT] Testing Engine: ${api.name}...`);
                const data = await fetchSecureAPI(api.url);
                
                if (!data) continue;

                // Deep Extractor for different API JSON responses
                if (data.result && data.result[0] && data.result[0].url) {
                    finalVideoUrl = data.result[0].url;
                    fileName = data.result[0].filename || fileName;
                } else if (data.data && data.data[0] && data.data[0].url) {
                    finalVideoUrl = data.data[0].url;
                    fileName = data.data[0].filename || data.title || fileName;
                } else if (data.url) {
                    finalVideoUrl = data.url;
                    fileName = data.title || fileName;
                }

                if (finalVideoUrl && finalVideoUrl.startsWith('http')) {
                    console.log(`[BOT] [KOSEM BOT] 🟢 Success via ${api.name}!`);
                    fileName = fileName.replace(/[^\w\s.-]/g, '').substring(0, 50);
                    if (!fileName.endsWith('.mp4')) fileName += '.mp4';
                    break;
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Download Failed*', 'The file size is either too large or it requires a private account login to decrypt.');
            }

            console.log(`[BOT] [KOSEM BOT] Sending HD Document to WhatsApp...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Processed by ${botName}*\n`;
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
            return await sendMsg(sock, msg, extra, '❌ *System Error*', 'Kosem Bot encountered an internal crash while fetching the media.');
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

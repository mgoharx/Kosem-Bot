/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * Anti-Block Edition: Bypasses Render VPS restrictions
 * Uses API endpoints that do not block Data Center IPs.
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download Full HD Videos from Terabox',
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
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a Terabox link.');
            }

            // 🚀 Extract exact ID to prevent domain format issues
            const idMatch = text.match(/\/s\/([a-zA-Z0-9_.-]+)/);
            if (!idMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Make sure it is a valid Terabox link containing /s/ (e.g., terabox.com/s/1xyz).');
            }

            const tbId = idMatch[1];
            const cleanUrl = `https://teraboxapp.com/s/${tbId}`;

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Bypassing Security...*', 'Extracting HD Video link via secure tunnels. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target ID: ${tbId}`);

            // 🚀 ANTI-BLOCK FETCHER: Simulates a normal Android phone
            const fetchAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s Timeout
                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            // Spoofing as Android Mobile to bypass bot-checks
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    return await response.json();
                } catch (e) {
                    clearTimeout(timeoutId);
                    console.log(`[Error Logs] Fetch failed for ${apiUrl.substring(0, 30)}... Reason: ${e.message}`);
                    return null;
                }
            };

            const encodedUrl = encodeURIComponent(cleanUrl);
            
            // 🚀 DEVELOPER APIs (These rarely block Render IPs)
            const apis = [
                { name: "Siputzx API", url: `https://api.siputzx.my.id/api/d/terabox?url=${encodedUrl}` },
                { name: "Itzpire API", url: `https://itzpire.com/download/terabox?url=${encodedUrl}` },
                { name: "Ryzendesu API", url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodedUrl}` },
                { name: "Vreden API", url: `https://api.vreden.web.id/api/terabox?url=${encodedUrl}` },
                { name: "Cloud Worker", url: `https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${tbId}` }
            ];

            let finalVideoUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";

            // ⚙️ THE HUNTING LOOP
            for (let api of apis) {
                console.log(`[BOT] [KOSEM BOT] Testing Engine: ${api.name}...`);
                const data = await fetchAPI(api.url);
                
                if (!data) continue;

                // Extract link based on various API JSON structures
                if (data.data && Array.isArray(data.data) && data.data[0]?.url) {
                    finalVideoUrl = data.data[0].url; // Siputzx format
                    fileName = data.data[0].filename || data.title || fileName;
                } 
                else if (data.data && typeof data.data.url === 'string') {
                    finalVideoUrl = data.data.url; // Itzpire format
                    fileName = data.data.title || data.title || fileName;
                }
                else if (data.url && typeof data.url === 'string') {
                    finalVideoUrl = data.url; // Ryzen format
                    fileName = data.title || fileName;
                }
                else if (data.list && Array.isArray(data.list) && data.list[0]?.dlink) {
                    finalVideoUrl = data.list[0].dlink; // Worker format
                    fileName = data.list[0].filename || fileName;
                }

                // Check if the URL is valid
                if (finalVideoUrl && finalVideoUrl.startsWith('http')) {
                    console.log(`[BOT] [KOSEM BOT] 🟢 Success via ${api.name}!`);
                    fileName = fileName.replace(/[^\w\s.-]/g, '').substring(0, 50); // Clean filename
                    if (!fileName.endsWith('.mp4')) fileName += '.mp4';
                    break;
                } else {
                    finalVideoUrl = null; // Reset if invalid
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Download Failed*', 'All engines were blocked. The file might be strictly private or Terabox is running a captcha check.');
            }

            console.log(`[BOT] [KOSEM BOT] Sending HD Document to WhatsApp...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY AS DOCUMENT (Full HD Quality)
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
            return await sendMsg(sock, msg, extra, '❌ *System Error*', 'Kosem Bot encountered a crash while fetching the video.');
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

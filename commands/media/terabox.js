/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * Fast & Clean API Extraction
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'tbdl', 'teradl'],
    category: 'media',
    description: 'Download HD Videos directly from Terabox',
    usage: '.terabox <Terabox URL>',
    
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
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Link Missing*\n`;
                errText += `💡 Please provide a valid Terabox link.\n`;
                errText += `✦ *Example:* \`.terabox https://teraboxapp.com/s/...\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // Accept all major Terabox domains
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(terabox\.com|teraboxapp\.com|1024tera\.com|freeterabox\.com|4funbox\.com|nephobox\.com)\/[a-zA-Z0-9_/-]+/i);
            const targetUrl = urlMatch ? urlMatch[0] : null;

            if (!targetUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Terabox Link*\n`;
                errText += `💡 Make sure the link is from Terabox.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Fetching File...*\n`;
            waitText += `💡 Extracting the direct HD video link. Please wait...\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 FAST FETCHER
            const fetchAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s Timeout

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
                    return await response.json();
                } catch (e) {
                    clearTimeout(timeoutId);
                    return null;
                }
            };

            let finalUrl = null;
            let fileName = "Terabox_Video.mp4";

            console.log(`[BOT] [KOSEM BOT] 🟢 Terabox Link Detected: ${targetUrl}`);

            // 🚀 TOP TIER TERABOX APIs (Stable ones)
            const encodedUrl = encodeURIComponent(targetUrl);
            const apis = [
                { name: 'Vreden API', url: `https://api.vreden.web.id/api/terabox?url=${encodedUrl}` },
                { name: 'Itzpire API', url: `https://itzpire.com/download/terabox?url=${encodedUrl}` },
                { name: 'Ryzen API', url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodedUrl}` }
            ];

            for (let api of apis) {
                console.log(`[BOT] [KOSEM BOT] Testing Engine: ${api.name}...`);
                const data = await fetchAPI(api.url);
                
                if (!data) continue;

                // Smart URL Extractor
                const possibleLinks = [
                    data?.video, data?.url, data?.data?.url, data?.result?.url, 
                    data?.data?.[0]?.url, data?.data?.[0]?.resolutions?.['Fast Download']
                ];

                for (let link of possibleLinks) {
                    if (typeof link === 'string' && link.startsWith('http')) {
                        finalUrl = link;
                        break;
                    }
                }

                // Get Title
                const rawTitle = data?.title || data?.data?.title || data?.result?.title;
                if (typeof rawTitle === 'string') {
                    fileName = rawTitle.replace(/[^\w\s.-]/g, '') + ".mp4";
                }

                if (finalUrl) {
                    console.log(`[BOT] [KOSEM BOT] 🟢 Success via ${api.name}!`);
                    break;
                }
            }

            if (!finalUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Download Failed*\n`;
                errText += `💡 Terabox rejected the request. The file might be private, deleted, or requires a captcha.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] Sending Document stream to WhatsApp...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 SEND AS DOCUMENT STREAM (No VPS RAM crash, Full HD)
            if (extra.react) await extra.react('✅');
            
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: finalUrl }, 
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: captionText
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *System Crash*\n`;
            errText += `💡 Kosem Bot encountered an error while processing the Terabox link.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * 100% Stable & Clean Version (Like TikTok Downloader)
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl'], // Sirf Terabox ke aliases
    category: 'media',
    description: 'Download Full HD Videos from Terabox',
    usage: '.tb <Terabox URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            // Anti-Spam protection
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a Terabox link.');
            }

            // 🚀 THE SECRET FIX: Extract the ID instead of the whole domain
            const idMatch = text.match(/\/s\/([a-zA-Z0-9_.-]+)/);
            if (!idMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Make sure it is a valid Terabox link containing /s/ (e.g., terabox.com/s/1xyz).');
            }

            // 🚀 SMART CONVERTER: Convert ANY weird Terabox domain into the official one
            const cleanUrl = `https://www.teraboxapp.com/s/${idMatch[1]}`;

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Downloading...*', 'Fetching Full HD Video from Terabox. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Standardized Terabox Link: ${cleanUrl}`);

            // 🚀 CLEAN & STABLE FETCHER
            const fetchAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 Seconds Timeout
                try {
                    const response = await fetch(apiUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    return await response.json();
                } catch (e) {
                    clearTimeout(timeoutId);
                    return null;
                }
            };

            const encodedUrl = encodeURIComponent(cleanUrl);
            
            // 🚀 TOP 3 MOST STABLE APIs (Used in Premium Bots)
            const apis = [
                `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodedUrl}`,
                `https://api.vreden.web.id/api/terabox?url=${encodedUrl}`,
                `https://itzpire.com/download/terabox?url=${encodedUrl}`
            ];

            let finalVideoUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";

            for (let api of apis) {
                const data = await fetchAPI(api);
                if (!data) continue;

                // Smart URL Finder
                const findLink = (obj) => {
                    if(typeof obj === 'string' && obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png')) return obj;
                    if(Array.isArray(obj)) {
                        for(let item of obj) {
                            let res = findLink(item);
                            if(res) return res;
                        }
                    }
                    if(typeof obj === 'object' && obj !== null) {
                        for(let key of ['hdplay', 'video', 'url', 'download']) {
                            if(typeof obj[key] === 'string' && obj[key].startsWith('http') && !obj[key].includes('.jpg')) return obj[key];
                        }
                        for(let key in obj) {
                            if(typeof obj[key] === 'object') {
                                let res = findLink(obj[key]);
                                if(res) return res;
                            }
                        }
                    }
                    return null;
                };

                finalVideoUrl = findLink(data);

                // Smart Title Finder
                let rawTitle = data.title || data.filename || data.data?.[0]?.title || data.result?.title;
                if (typeof rawTitle === 'string') {
                    fileName = rawTitle.replace(/[^\w\s.-]/g, '').substring(0, 50) + ".mp4";
                }

                if (finalVideoUrl) {
                    console.log(`[BOT] [KOSEM BOT] 🟢 Success! HD Link generated.`);
                    break;
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Download Failed*', 'The file is either private, deleted, or requires account login.');
            }

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY AS DOCUMENT (Full HD Quality, No Compression)
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

// Beautiful Message Handler
async function sendMsg(sock, msg, extra, title, body) {
    let text = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
    text += `${title}\n`;
    text += `💡 ${body}\n`;
    text += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
    return await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
}

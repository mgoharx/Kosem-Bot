/**
 * 👑 Kosem Bot Premium DiskWala Downloader
 * V2 Elite Bypass - Fresh APIs & Anti-Cloudflare Headers
 * 100% Syntax Fixed - No Crash
 */

const config = require('../../config');

const processedMessages = new Set();

module.exports = {
    name: 'diskwala',
    aliases: ['dw', 'diskwaladl', 'dwdownload', 'terabox'],
    category: 'media',
    description: 'Download Full HD Videos from DiskWala/Terabox',
    usage: '.diskwala <DiskWala URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            // Anti-Spam System
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Link Missing*\n`;
                errText += `💡 Please provide a valid DiskWala link.\n`;
                errText += `✦ *Example:* \`.dw https://diskwala.com/...\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // Extract DiskWala or Terabox URL
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(diskwala\.(com|app)|terabox\.com|teraboxapp\.com|1024tera\.com|freeterabox\.com)\/[^\s]+/i);
            const url = urlMatch ? urlMatch[0] : null;

            if (!url) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Link*\n`;
                errText += `💡 That is not a valid DiskWala or Terabox link.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Spoofing Servers & Extracting File...*\n`;
            waitText += `💡 Bypassing Cloudflare security to get the Full HD source.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 SMART PARSER
            const extractVideoUrl = (obj) => {
                if (typeof obj === 'string' && obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png')) return obj;
                if (typeof obj === 'object' && obj !== null) {
                    const keysToCheck = ['video', 'videoUrl', 'url', 'hdplay', 'download', 'file', 'link', 'fast_download'];
                    for (let key of keysToCheck) {
                        if (obj[key]) {
                            if (typeof obj[key] === 'string' && obj[key].startsWith('http')) return obj[key];
                            let deepSearch = extractVideoUrl(obj[key]);
                            if (deepSearch) return deepSearch;
                        }
                    }
                }
                return null;
            };

            // 🚀 BROWSER SIMULATION WITH ELITE ANTI-CLOUDFLARE HEADERS
            const fetchFromAI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s Timeout

                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        redirect: 'follow',
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Connection': 'keep-alive'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    const textData = await response.text();
                    try { return JSON.parse(textData); } 
                    catch (e) { return { text_response: textData.substring(0, 100) }; }
                } catch (err) {
                    clearTimeout(timeoutId);
                    throw err;
                }
            };

            let finalVideoUrl = null;
            let fileName = "DiskWala_HD_Video.mp4";

            console.log(`[BOT] [KOSEM BOT] 🟢 DiskWala link detected. Bypassing protection...`);

            // 🚀 MULTI-API ENGINE (Using Cloud Storage Decryptors)
            const apis = [
                { name: 'Siputzx Cloud', url: `https://api.siputzx.my.id/api/d/terabox?url=${encodeURIComponent(url)}` },
                { name: 'Ryzendesu Drive', url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodeURIComponent(url)}` },
                { name: 'BK9 Storage', url: `https://bk9.site/download/terabox?url=${encodeURIComponent(url)}` }
            ];

            for (let api of apis) {
                try {
                    console.log(`[BOT] [KOSEM BOT] Engine: ${api.name} processing...`);
                    const rawData = await fetchFromAI(api.url);
                    console.log(`[API RESPONSE - ${api.name}]:`, JSON.stringify(rawData).substring(0, 150));
                    
                    finalVideoUrl = extractVideoUrl(rawData);
                    
                    if (rawData.title || rawData.data?.title || rawData.result?.title) {
                        fileName = (rawData.title || rawData.data?.title || rawData.result?.title).replace(/[^\w\s.-]/g, '') + ".mp4";
                    }

                    if (finalVideoUrl) {
                        console.log(`[BOT] [KOSEM BOT] 🟢 Success! HD Link extracted.`);
                        break;
                    }
                } catch (e) {
                    console.log(`[BOT] [KOSEM BOT] 🔴 ${api.name} failed: ${e.message}`);
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Download Failed*\n`;
                errText += `💡 Could not bypass DiskWala security. The file might be private, deleted, or requires a captcha.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] Sending video as Document to preserve Full HD quality...`);
            
            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

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
            errText += `💡 Kosem Bot encountered a critical error while processing the DiskWala link.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

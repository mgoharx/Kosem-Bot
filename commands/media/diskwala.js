/**
 * 👑 Kosem Bot Premium DiskWala Downloader
 * V3 Bypass - Fresh Working APIs + Deep Array Parser
 * Built to bypass Cloudflare Blocks on Render
 */

const config = require('../../config');

const processedMessages = new Set();

module.exports = {
    name: 'diskwala',
    aliases: ['dw', 'diskwaladl', 'dwdownload', 'terabox'],
    category: 'media',
    description: 'Download HD Videos from DiskWala/Terabox App',
    usage: '.dw <DiskWala URL>',
    
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
                errText += `💡 Please provide a valid DiskWala or Terabox link.\n`;
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
            waitText += `⏳ *Bypassing DiskWala Security...*\n`;
            waitText += `💡 Extracting HD File. This may take 10-30 seconds.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 ULTRA-DEEP PARSER: Can dig into arrays and nested objects
            const extractVideoUrl = (obj) => {
                if (typeof obj === 'string' && obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png')) return obj;
                
                if (Array.isArray(obj)) {
                    for (let item of obj) {
                        let deepSearch = extractVideoUrl(item);
                        if (deepSearch) return deepSearch;
                    }
                }
                
                if (typeof obj === 'object' && obj !== null) {
                    const keysToCheck = ['video', 'videoUrl', 'url', 'hdplay', 'download', 'file', 'link', 'fast_download', 'url_download'];
                    for (let key of keysToCheck) {
                        if (obj[key]) {
                            if (typeof obj[key] === 'string' && obj[key].startsWith('http') && !obj[key].includes('.jpg') && !obj[key].includes('.png')) return obj[key];
                            let deepSearch = extractVideoUrl(obj[key]);
                            if (deepSearch) return deepSearch;
                        }
                    }
                    // Search remaining keys as fallback
                    for (let key in obj) {
                        if (typeof obj[key] === 'object') {
                            let deepSearch = extractVideoUrl(obj[key]);
                            if (deepSearch) return deepSearch;
                        }
                    }
                }
                return null;
            };

            // 🚀 BROWSER SIMULATION API CALL
            const fetchFromAI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); 

                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        redirect: 'follow',
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*'
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

            console.log(`[BOT] [KOSEM BOT] 🟢 DiskWala link detected. Injecting bypass routes...`);

            // 🚀 FRESH WORKING APIS (Terabox/DiskWala supported)
            const apis = [
                { name: 'Itzpire Engine', url: `https://itzpire.com/download/terabox?url=${encodeURIComponent(url)}` },
                { name: 'Vreden Engine', url: `https://api.vreden.web.id/api/terabox?url=${encodeURIComponent(url)}` },
                { name: 'AEMT Drive', url: `https://aemt.me/terabox?url=${encodeURIComponent(url)}` },
                { name: 'Nyxs Storage', url: `https://api.nyxs.pw/dl/terabox?url=${encodeURIComponent(url)}` }
            ];

            for (let api of apis) {
                try {
                    console.log(`[BOT] [KOSEM BOT] Engine: ${api.name} processing...`);
                    const rawData = await fetchFromAI(api.url);
                    
                    // Log response for debugging
                    console.log(`[API RESPONSE - ${api.name}]:`, JSON.stringify(rawData).substring(0, 200));
                    
                    finalVideoUrl = extractVideoUrl(rawData);
                    
                    // Try to catch realistic filename
                    if (rawData.title || rawData.data?.title || rawData.result?.title || rawData.data?.[0]?.title) {
                        const titleRaw = rawData.title || rawData.data?.title || rawData.result?.title || rawData.data?.[0]?.title;
                        if (typeof titleRaw === 'string') {
                            fileName = titleRaw.replace(/[^\w\s.-]/g, '') + ".mp4";
                        }
                    }

                    if (finalVideoUrl) {
                        console.log(`[BOT] [KOSEM BOT] 🟢 Success! HD Link extracted from ${api.name}.`);
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
                errText += `💡 DiskWala servers are actively blocking the extraction. The file might be private or require a manual captcha solve.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] Sending HD video as Document stream...`);
            
            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 SEND AS DOCUMENT URL
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

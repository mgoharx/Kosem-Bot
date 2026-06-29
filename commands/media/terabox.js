/**
 * 👑 Kosem Bot Premium Terabox/Diskwala Downloader
 * Deep-Think HD Edition - Zero Errors, Max Quality
 * Handles ALL Terabox mirror domains and auto-selects HD video.
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'tbdl', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download Full HD Videos from Terabox',
    usage: '.tb <Terabox URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            // Anti-Spam (Prevents bot from crashing on multi-clicks)
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
                errText += `💡 Please provide a Terabox or Diskwala link.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // 🚀 UNIVERSAL REGEX: Catches EVERY possible Terabox clone domain
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(?:[a-zA-Z0-9-]+\.)?(terabox|1024tera|1024terabox|freeterabox|4funbox|nephobox|momerybox|teraboxapp|diskwala|mirrobox)\.(com|app|net)\/[^\s]+/i);
            const targetUrl = urlMatch ? urlMatch[0] : null;

            if (!targetUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Format*\n`;
                errText += `💡 Link not recognized. Please make sure it's a valid Terabox/Diskwala link.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 𝐇𝐃 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Analyzing & Extracting...*\n`;
            waitText += `💡 Forcing High-Quality (HD) extraction. This might take a few seconds.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 SECURE FETCHER WITH TIMEOUT & CLOUDFLARE AVOIDANCE
            const fetchAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s per API limit

                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    const textResponse = await response.text();
                    
                    // Prevent JSON parse crash if API sends HTML/Captcha
                    if (textResponse.includes('<html') || textResponse.includes('Cloudflare')) return null;
                    
                    return JSON.parse(textResponse);
                } catch (e) {
                    clearTimeout(timeoutId);
                    return null;
                }
            };

            console.log(`[BOT] [KOSEM BOT] 🟢 Target URL locked: ${targetUrl}`);

            let finalUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";

            // 🚀 STABLE API ROSTER (Sorted by reliability)
            const encodedUrl = encodeURIComponent(targetUrl);
            const apis = [
                { name: 'Vreden HD', url: `https://api.vreden.web.id/api/terabox?url=${encodedUrl}` },
                { name: 'Itzpire Engine', url: `https://itzpire.com/download/terabox?url=${encodedUrl}` },
                { name: 'AEMT Drive', url: `https://aemt.me/terabox?url=${encodedUrl}` },
                { name: 'Siputzx Core', url: `https://api.siputzx.my.id/api/d/terabox?url=${encodedUrl}` },
                { name: 'Ryzendesu', url: `https://api.ryzendesu.vip/api/downloader/terabox?url=${encodedUrl}` }
            ];

            // 🚀 DEEP QUALITY HUNTER: Recursively searches for the best URL
            const extractHDVideo = (obj) => {
                let foundUrls = [];
                
                const search = (item) => {
                    if (typeof item === 'string' && item.startsWith('http') && !item.includes('.jpg') && !item.includes('.png')) {
                        foundUrls.push(item);
                    } else if (Array.isArray(item)) {
                        item.forEach(search);
                    } else if (typeof item === 'object' && item !== null) {
                        for (let key in item) {
                            // If key implies high quality, mark it so we can prioritize
                            if (typeof item[key] === 'string' && item[key].startsWith('http')) {
                                if (key.toLowerCase().includes('hd') || key.toLowerCase().includes('original') || key.toLowerCase().includes('fast')) {
                                    foundUrls.unshift(item[key]); // Put HD links at the VERY FRONT of the array
                                } else if (!item[key].includes('.jpg')) {
                                    foundUrls.push(item[key]); // Put normal links at the back
                                }
                            } else {
                                search(item[key]);
                            }
                        }
                    }
                };
                
                search(obj);
                // Return the first link (which will be HD if found, or standard if not)
                return foundUrls.length > 0 ? foundUrls[0] : null;
            };

            for (let api of apis) {
                console.log(`[BOT] [KOSEM BOT] Executing Engine: ${api.name}...`);
                const data = await fetchAPI(api.url);
                
                if (!data) continue;

                // Grab URL using the HD Priority function
                finalUrl = extractHDVideo(data);

                // Safely grab the Title
                let rawTitle = data?.title || data?.data?.title || data?.result?.title || data?.data?.[0]?.title || data?.filename;
                if (rawTitle && typeof rawTitle === 'string') {
                    fileName = rawTitle.replace(/[^\w\s.-]/g, '').substring(0, 50) + ".mp4"; // Strip weird chars, max 50 chars length
                }

                if (finalUrl) {
                    console.log(`[BOT] [KOSEM BOT] 🟢 Success! Link extracted via ${api.name}.`);
                    break;
                }
            }

            if (!finalUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Extraction Failed*\n`;
                errText += `💡 All nodes failed to decrypt the link. The file might be private, deleted, or Terabox is enforcing strict captchas.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] Routing HD Document to WhatsApp...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 𝐇𝐃 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Processed by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY: Send as Document to preserve original Full HD pixels
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
            errText += `💡 The extraction engine overloaded or the video file size exceeded memory limits.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

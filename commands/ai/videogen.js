/**
 * 👑 Kosem Bot Premium AI Video Generator
 * V3 Engine - Fresh APIs (Nyxs, Itzpire, Siputzx New Routes)
 * Built for Render Host Cloudflare Bypass
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'videogen',
    aliases: ['vidgen', 't2v', 'i2v', 'videoai', 'luma'],
    category: 'ai',
    description: 'Generate AI Video from Text or Image',
    usage: '.videogen <prompt> OR Reply to an image with .videogen <prompt>',
    
    async execute(sock, msg, args, extra) {
        try {
            const prompt = args.join(' ').trim();
            
            if (!prompt) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Prompt Missing*\n`;
                errText += `💡 Please describe the video you want to generate.\n`;
                errText += `✦ *Example:* \`.videogen a futuristic city with flying cars\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                
                if (extra.react) await extra.react('❌');
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐕𝐈𝐃𝐄𝐎 𝐀𝐈 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Processing Request...*\n`;
            waitText += `💡 Request sent to AI GPU. This can take 1 to 3 minutes. Please wait...\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 SMART PARSER
            const extractVideoUrl = (obj) => {
                if (typeof obj === 'string' && obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png')) return obj;
                if (typeof obj === 'object' && obj !== null) {
                    const keysToCheck = ['video', 'videoUrl', 'url', 'hdplay', 'result', 'data', 'BK9', 'link', 'kling'];
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

            // 🚀 BROWSER SIMULATION WITH ANTI-RENDER HEADERS
            const fetchFromAI = async (url) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 Minutes Timeout

                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        redirect: 'follow',
                        signal: controller.signal,
                        headers: {
                            // Aggressive headers to bypass Cloudflare on Render IPs
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Origin': 'https://google.com',
                            'Referer': 'https://google.com/'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    const textData = await response.text();
                    try {
                        return JSON.parse(textData);
                    } catch (e) {
                        return { text_response: textData.substring(0, 100) + "..." }; 
                    }
                } catch (err) {
                    clearTimeout(timeoutId);
                    throw err;
                }
            };

            let finalVideoUrl = null;
            let mode = "Text-to-Video";
            const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

            if (isQuotedImage) {
                mode = "Image-to-Video";
                console.log(`[BOT] [KOSEM BOT] 🟢 Image detected! Extracting buffer...`);
                
                const quotedMsgInfo = msg.message.extendedTextMessage.contextInfo;
                const fakeMsgForDownload = {
                    key: { remoteJid: quotedMsgInfo.remoteJid, id: quotedMsgInfo.stanzaId },
                    message: quotedMsgInfo.quotedMessage
                };
                
                const imageBuffer = await downloadMediaMessage(fakeMsgForDownload, 'buffer', {}, { logger: console });
                
                console.log(`[BOT] [KOSEM BOT] Uploading image to Catbox...`);
                const formData = new FormData();
                formData.append('reqtype', 'fileupload');
                formData.append('fileToUpload', new Blob([imageBuffer]), 'image.jpg');
                
                const uploadRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
                const uploadedImageUrl = await uploadRes.text();
                
                // 🚀 NEW I2V API ROUTES
                const i2vApis = [
                    { name: 'Nyxs Luma I2V', url: `https://api.nyxs.pw/ai/luma?text=${encodeURIComponent(prompt)}&image=${encodeURIComponent(uploadedImageUrl)}` },
                    { name: 'Itzpire Luma I2V', url: `https://itzpire.com/ai/luma?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(uploadedImageUrl)}` }
                ];

                for (let api of i2vApis) {
                    try {
                        console.log(`[BOT] [KOSEM BOT] Engine: ${api.name} processing...`);
                        const rawData = await fetchFromAI(api.url);
                        console.log(`[API RESPONSE - ${api.name}]:`, JSON.stringify(rawData).substring(0, 200));
                        finalVideoUrl = extractVideoUrl(rawData);
                        if (finalVideoUrl) break;
                    } catch (e) {
                        console.log(`[BOT] [KOSEM BOT] 🔴 ${api.name} failed: ${e.message}`);
                    }
                }
            } else {
                console.log(`[BOT] [KOSEM BOT] 🟢 Text-to-Video mode active...`);
                
                // 🚀 NEW FRESH T2V API ROUTES
                const t2vApis = [
                    { name: 'Itzpire Luma', url: `https://itzpire.com/ai/luma?prompt=${encodeURIComponent(prompt)}` },
                    { name: 'Nyxs Luma', url: `https://api.nyxs.pw/ai/luma?text=${encodeURIComponent(prompt)}` },
                    { name: 'Siputzx Kling New', url: `https://api.siputzx.my.id/api/ai/kling-video?prompt=${encodeURIComponent(prompt)}` },
                    { name: 'AEMT Haiper', url: `https://aemt.me/haiper?text=${encodeURIComponent(prompt)}` }
                ];

                for (let api of t2vApis) {
                    try {
                        console.log(`[BOT] [KOSEM BOT] Engine: ${api.name} processing...`);
                        const rawData = await fetchFromAI(api.url);
                        console.log(`[API RESPONSE - ${api.name}]:`, JSON.stringify(rawData).substring(0, 200));
                        
                        finalVideoUrl = extractVideoUrl(rawData);
                        if (finalVideoUrl) {
                            console.log(`[BOT] [KOSEM BOT] 🟢 Success! Video URL found.`);
                            break;
                        }
                    } catch (e) {
                        console.log(`[BOT] [KOSEM BOT] 🔴 ${api.name} failed: ${e.message}`);
                    }
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Generation Failed*\n`;
                errText += `💡 The AI servers are currently overloaded or blocked the connection. Please try again later.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] Downloading finalized video buffer...`);
            
            let captionText = `❖ ───── ✦ 𝐕𝐈𝐃𝐄𝐎 𝐀𝐈 ✦ ───── ❖\n\n`;
            captionText += `🎬 *Mode:* ${mode}\n`;
            captionText += `💬 *Prompt:* ${prompt}\n\n`;
            captionText += `✨ *Generated by Kosem Bot*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            try {
                const vidRes = await fetch(finalVideoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const vidArrayBuffer = await vidRes.arrayBuffer();
                const videoBuffer = Buffer.from(vidArrayBuffer);

                if (extra.react) await extra.react('✅');
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: videoBuffer, 
                    mimetype: 'video/mp4',
                    caption: captionText 
                }, { quoted: msg });

            } catch (bufferErr) {
                console.log(`[BOT] [KOSEM BOT] 🔴 Buffer too large, sending direct URL...`);
                if (extra.react) await extra.react('✅');
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: { url: finalVideoUrl }, 
                    mimetype: 'video/mp4',
                    caption: captionText 
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *System Crash*\n`;
            errText += `💡 Kosem Bot encountered a critical error while rendering the AI video.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

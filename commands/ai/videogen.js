/**
 * 👑 Kosem Bot Premium AI Video Generator
 * Supports Text-to-Video and Image-to-Video
 * Native Fetch Engine (Cloudflare Bypass)
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

            // 🚀 Send initial waiting message (Video AI takes time)
            let waitText = `❖ ───── ✦ 𝐕𝐈𝐃𝐄𝐎 𝐀𝐈 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Processing Request...*\n`;
            waitText += `💡 Please wait 1 to 3 minutes. Rendering high-quality AI videos requires massive server power.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 BROWSER SIMULATION: Native fetch
            const fetchFromAI = async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': '*/*'
                    }
                });

                if (!response.ok) throw new Error(`API blocked with status: ${response.status}`);
                return await response.json();
            };

            let finalVideoUrl = null;
            let mode = "Text-to-Video";

            // 🖼️ CHECK FOR QUOTED IMAGE (For Image-to-Video)
            const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

            if (isQuotedImage) {
                mode = "Image-to-Video";
                console.log(`[BOT] [KOSEM BOT] 🟢 Image detected! Switching to Image-to-Video mode...`);
                
                // 1. Download the quoted image buffer
                const quotedMsgInfo = msg.message.extendedTextMessage.contextInfo;
                const fakeMsgForDownload = {
                    key: { remoteJid: quotedMsgInfo.remoteJid, id: quotedMsgInfo.stanzaId },
                    message: quotedMsgInfo.quotedMessage
                };
                
                const imageBuffer = await downloadMediaMessage(fakeMsgForDownload, 'buffer', {}, { logger: console });
                
                // 2. Upload image to Catbox.moe to get a public URL for the AI
                const formData = new FormData();
                formData.append('reqtype', 'fileupload');
                formData.append('fileToUpload', new Blob([imageBuffer]), 'kosem_image.jpg');
                
                const uploadRes = await fetch('https://catbox.moe/user/api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const uploadedImageUrl = await uploadRes.text();
                console.log(`[BOT] [KOSEM BOT] 🟢 Image uploaded to: ${uploadedImageUrl}`);

                // 3. Call Image-to-Video API
                const i2vApis = [
                    { url: `https://api.siputzx.my.id/api/ai/luma?url=${encodeURIComponent(uploadedImageUrl)}&prompt=${encodeURIComponent(prompt)}` },
                    { url: `https://api.ryzendesu.vip/api/ai/kling?url=${encodeURIComponent(uploadedImageUrl)}&prompt=${encodeURIComponent(prompt)}` }
                ];

                for (let api of i2vApis) {
                    try {
                        console.log(`[BOT] [KOSEM BOT] Generating video via AI engine...`);
                        const rawData = await fetchFromAI(api.url);
                        // Parsing logic depends on API response structure
                        if (rawData && (rawData.url || rawData.video || rawData.data?.url || rawData.data?.video)) {
                            finalVideoUrl = rawData.url || rawData.video || rawData.data?.url || rawData.data?.video;
                            break;
                        }
                    } catch (e) {
                        console.log(`[BOT] [KOSEM BOT] 🔴 Endpoint failed, trying next...`);
                    }
                }
            } else {
                // 📝 TEXT-TO-VIDEO MODE
                console.log(`[BOT] [KOSEM BOT] 🟢 No image detected. Using Text-to-Video mode...`);
                
                const t2vApis = [
                    { url: `https://bk9.site/ai/luma?q=${encodeURIComponent(prompt)}` },
                    { url: `https://api.siputzx.my.id/api/ai/klingvideo?prompt=${encodeURIComponent(prompt)}` },
                    { url: `https://api.vreden.web.id/api/luma?text=${encodeURIComponent(prompt)}` }
                ];

                for (let api of t2vApis) {
                    try {
                        console.log(`[BOT] [KOSEM BOT] Generating video via AI engine...`);
                        const rawData = await fetchFromAI(api.url);
                        
                        // Look for standard video URL keys in JSON
                        const url = rawData.BK9 || rawData.data?.video || rawData.url || rawData.result?.url || rawData.data?.url;
                        if (url && url.includes('http')) {
                            finalVideoUrl = url;
                            break;
                        }
                    } catch (e) {
                        console.log(`[BOT] [KOSEM BOT] 🔴 Endpoint failed, trying next...`);
                    }
                }
            }

            // 🛑 ERROR HANDLING
            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Generation Failed*\n`;
                errText += `💡 The AI servers are currently overloaded or the prompt was rejected. Please try again later.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // 🚀 DOWNLOAD AND SEND THE RENDERED VIDEO
            console.log(`[BOT] [KOSEM BOT] 🟢 AI Video ready! Downloading buffer: ${finalVideoUrl}`);
            
            // Premium Thematic Caption
            let captionText = `❖ ───── ✦ 𝐕𝐈𝐃𝐄𝐎 𝐀𝐈 ✦ ───── ❖\n\n`;
            captionText += `🎬 *Mode:* ${mode}\n`;
            captionText += `💬 *Prompt:* ${prompt}\n\n`;
            captionText += `✨ *Generated by Kosem Bot*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            try {
                // Fetch video as buffer to avoid URL blocks on the user's end
                const vidRes = await fetch(finalVideoUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const vidArrayBuffer = await vidRes.arrayBuffer();
                const videoBuffer = Buffer.from(vidArrayBuffer);

                if (extra.react) await extra.react('✅');
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: videoBuffer, 
                    mimetype: 'video/mp4',
                    caption: captionText 
                }, { quoted: msg });

            } catch (bufferErr) {
                console.log(`[BOT] [KOSEM BOT] 🔴 Buffer failed, sending direct URL...`);
                // Fallback: Send via URL if buffer download fails
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

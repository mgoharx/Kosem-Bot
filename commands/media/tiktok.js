/**
 * 👑 Kosem Bot Premium TikTok Downloader
 * Downloads No-Watermark HD TikTok Videos
 * Bypass VPS Blocks using Native Fetch Engine
 */

const config = require('../../config'); // Keep your original config requirement

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'ttdl', 'tiktokdl'],
    category: 'media',
    description: 'Download HD TikTok videos without watermark',
    usage: '.tiktok <TikTok URL>',
    
    async execute(sock, msg, args) {
        try {
            // Anti-Spam: Check if message has already been processed
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000); // 5 mins cleanup

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Link Missing*\n`;
                errText += `💡 Please provide a valid TikTok video link.\n`;
                errText += `✦ *Example:* \`.tiktok https://vm.tiktok.com/...\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // Extract URL from command
            const urlMatch = text.match(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/i);
            const url = urlMatch ? urlMatch[0] : null;

            if (!url) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ That is not a valid TikTok link. Please try again.' 
                }, { quoted: msg });
            }

            await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔄', key: msg.key } });

            // 🚀 BROWSER SIMULATION: Native fetch for API and Video Buffer (Anti-Block)
            const fetchWithBypass = async (targetUrl, isJson = true) => {
                const response = await fetch(targetUrl, {
                    method: 'GET',
                    redirect: 'follow',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': '*/*'
                    }
                });

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                return isJson ? await response.json() : await response.arrayBuffer();
            };

            // 🚀 MULTI-API SYSTEM (Focusing on HD No-Watermark Quality)
            const apis = [
                {
                    name: "TikWM HD Engine",
                    url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
                    parse: (json) => ({
                        videoUrl: json.data.hdplay || json.data.play,
                        title: json.data.title || "TikTok Video"
                    })
                },
                {
                    name: "Siputzx Backup",
                    url: `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
                    parse: (json) => ({
                        videoUrl: json.data.video_nowatermark || json.data.video,
                        title: json.data.title || "TikTok Video"
                    })
                }
            ];

            let videoData = null;

            // ⚙️ THE HACKER LOOP: Extract Video URL
            for (let api of apis) {
                try {
                    console.log(`[BOT] Extracting TikTok data via ${api.name}...`);
                    const json = await fetchWithBypass(api.url, true);
                    
                    videoData = api.parse(json);
                    
                    if (videoData && videoData.videoUrl) {
                        console.log(`[BOT] 🟢 Success! Extracted URL from ${api.name}.`);
                        break; // Stop looking
                    }
                } catch (err) {
                    console.log(`[BOT] 🔴 ${api.name} failed. Trying backup...`);
                    continue;
                }
            }

            // 🛑 If all APIs failed to get the link
            if (!videoData || !videoData.videoUrl) {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Failed to process the TikTok link. The video might be private or deleted.' 
                }, { quoted: msg });
            }

            // 🚀 DOWNLOAD THE VIDEO BUFFER
            console.log(`[BOT] [KOSEM BOT] Downloading HD Video Buffer...`);
            let videoBuffer;
            try {
                const arrayBuffer = await fetchWithBypass(videoData.videoUrl, false);
                videoBuffer = Buffer.from(arrayBuffer);
                console.log(`[BOT] 🟢 Video downloaded successfully!`);
            } catch (err) {
                console.log(`[BOT] 🔴 Download Failed: ${err.message}`);
                
                // Final Fallback: Send just the URL if buffer download fails due to VPS limits
                const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
                return await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: videoData.videoUrl },
                    mimetype: 'video/mp4',
                    caption: `🎬 *DOWNLOADED BY ${botName}*\n\n📝 ${videoData.title}`
                }, { quoted: msg });
            }

            // Check file size (WhatsApp limits to approx 50-100MB depending on settings)
            const maxVideoSize = 100 * 1024 * 1024; // 100MB
            if (videoBuffer.length > maxVideoSize) {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: `❌ Video is too large to send via WhatsApp (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB).` 
                }, { quoted: msg });
            }

            // 🚀 FINAL DELIVERY: Send the HD Buffer
            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            const captionText = `🎬 *DOWNLOADED BY ${botName}*\n\n📝 ${videoData.title}`;

            await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: captionText
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Kosem Bot encountered an error while downloading the video.' 
            }, { quoted: msg });
        }
    }
};

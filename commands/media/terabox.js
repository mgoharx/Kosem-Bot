/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * 1024TeraDownloader & Premium API Bypass Edition
 */

const config = require('../../config');
const processedMessages = new Set();

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl'],
    category: 'media',
    description: 'Download Full HD Videos bypassing via 1024TeraDownloader',
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

            // Extract the unique ID from the link
            const idMatch = text.match(/\/s\/([a-zA-Z0-9_.-]+)/);
            if (!idMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Make sure it is a valid Terabox link containing /s/ (e.g., terabox.com/s/1xyz).');
            }

            // Create a clean URL for processing
            const cleanUrl = `https://teraboxapp.com/s/${idMatch[1]}`;

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Bypassing via 1024Tera...*', 'Extracting HD Video link. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target: ${cleanUrl}`);

            let finalVideoUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";

            // 🚀 ENGINE 1: 1024TeraDownloader Internal Backend (Simulating Web Request)
            try {
                console.log(`[BOT] [KOSEM BOT] Hitting 1024TeraDownloader Server...`);
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);
                
                const response = await fetch(`https://teraboxvideodownloader.com/api/get-info?url=${encodeURIComponent(cleanUrl)}`, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Origin': 'https://1024teradownloader.com',
                        'Referer': 'https://1024teradownloader.com/'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                const data = await response.json();
                
                if (data && data.status && data.resolutions) {
                    // Always try to grab Fast Download or HD Play
                    finalVideoUrl = data.resolutions['Fast Download'] || data.resolutions['HD Video'] || data.url;
                    if (data.title) fileName = data.title.replace(/[^\w\s.-]/g, '').substring(0, 50) + ".mp4";
                }
            } catch (err) {
                console.log(`[BOT] [KOSEM BOT] 🔴 1024Tera API Blocked.`);
            }

            // 🚀 ENGINE 2: Backup Premium Worker Engine
            if (!finalVideoUrl) {
                try {
                    console.log(`[BOT] [KOSEM BOT] Hitting Premium Worker Backend...`);
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 15000);
                    
                    const response = await fetch(`https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${idMatch[1]}`, {
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeout);
                    const data = await response.json();
                    
                    if (data && data.list && data.list[0]) {
                        finalVideoUrl = data.list[0].dlink || data.list[0].hdplay;
                        if (data.list[0].filename) fileName = data.list[0].filename.replace(/[^\w\s.-]/g, '').substring(0, 50) + ".mp4";
                    }
                } catch (err) {
                    console.log(`[BOT] [KOSEM BOT] 🔴 Worker Engine Failed.`);
                }
            }

            // 🚀 ENGINE 3: Third Fallback (TBDL)
            if (!finalVideoUrl) {
                try {
                    console.log(`[BOT] [KOSEM BOT] Hitting TBDL Scraper...`);
                    const res = await fetch(`https://tbdl.sansekai.my.id/api/download/terabox?url=${encodeURIComponent(cleanUrl)}`);
                    const data = await res.json();
                    
                    if (data && data.status && data.data) {
                        const videoData = data.data.find(v => v.resolution === 'Fast Download' || v.url);
                        if (videoData) finalVideoUrl = videoData.url;
                    }
                } catch (err) {
                    console.log(`[BOT] [KOSEM BOT] 🔴 TBDL Failed.`);
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Download Failed*', 'The file could not be bypassed. Terabox might be enforcing a captcha on this specific file.');
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 Success! Link generated.`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Bypassed by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY AS DOCUMENT
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

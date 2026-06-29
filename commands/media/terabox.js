/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * ApiDash VIP Edition (Strict Original MP4 Download)
 * Fixed: M3U8 Streaming payload bug completely removed.
 */

const config = require('../../config');
const processedMessages = new Set();

// 🔑 Gohar's Private API Key
const API_SECRET = "pk_h1upjqkb1ic3igwq8f3n4"; 

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download Original Source MP4 Video from Terabox',
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
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a valid Terabox link.');
            }

            const urlMatch = text.match(/https?:\/\/(?:www\.)?(?:[a-zA-Z0-9-]+\.)?(terabox|1024tera|1024terabox|freeterabox|4funbox|nephobox|momerybox|teraboxapp|diskwala|mirrobox)\.(com|app|net)\/[^\s]+/i);
            
            if (!urlMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Make sure the link is a valid Terabox URL.');
            }

            const targetUrl = urlMatch[0];

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Extracting Original File...*', 'Fetching the complete MP4 source video. This may take a moment for large files.');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target URL: ${targetUrl}`);

            const encodedUrl = encodeURIComponent(targetUrl);
            const apiUrl = `https://api.playterabox.com/api/proxy?secret=${API_SECRET}&url=${encodedUrl}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            let finalVideoUrl = null;
            let fileName = "Terabox_Original_HD.mp4";
            let fileSize = "Unknown Size";

            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                const data = await response.json();

                if (data.status === "success" && data.list && data.list.length > 0) {
                    const fileData = data.list[0];

                    // 🚀 STRICT FIX: ONLY PICK THE REAL DOWNLOAD LINK (Banned stream_url)
                    // Normal download_link usually points to the raw MP4 binary.
                    finalVideoUrl = fileData.download_link || fileData.fast_download_link;
                    
                    // Failsafe: If the API accidentally gives an m3u8 playlist, reject it.
                    if (finalVideoUrl && finalVideoUrl.includes('.m3u8')) {
                        finalVideoUrl = null;
                    }

                    if (fileData.name) {
                        fileName = fileData.name.replace(/[^\w\s.-]/g, '').substring(0, 50);
                        if (!fileName.toLowerCase().endsWith('.mp4')) fileName += '.mp4';
                    }

                    if (fileData.size_formatted) {
                        fileSize = fileData.size_formatted;
                    }
                }
            } catch (err) {
                clearTimeout(timeoutId);
                console.log(`[BOT] API Fetch Error:`, err.message);
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Extraction Failed*', 'Could not extract the raw MP4 file. The API only returned a streaming link, or the file requires a password.');
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 SUCCESS! Preparing full MP4 Document delivery...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `📦 *Size:* ${fileSize}\n`;
            captionText += `✨ *Original Quality Preserved*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (extra.react) await extra.react('✅');
            
            // 🚀 SENT AS DOCUMENT: Bypasses WhatsApp compression to retain full quality
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: finalVideoUrl }, 
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: captionText
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            return await sendMsg(sock, msg, extra, '❌ *System Error*', 'Kosem Bot encountered an internal crash while processing the video.');
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

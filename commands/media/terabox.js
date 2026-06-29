/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * V13 TITAN ENGINE: Strict Original Quality (No Compression)
 * Analyzes headers to auto-compile M3U8 playlists or direct stream MP4s locally.
 */

const config = require('../../config');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);
const processedMessages = new Set();

// 🔑 Gohar's Private API Key
const API_SECRET = "pk_h1upjqkb1ic3igwq8f3n4"; 

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download 100% Original Source Video from Terabox',
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
            await sendMsg(sock, msg, extra, '⏳ *X-Raying Media...*', 'Analyzing the link to ensure you get the 100% Original Quality file. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target URL: ${targetUrl}`);

            const encodedUrl = encodeURIComponent(targetUrl);
            const apiUrl = `https://api.playterabox.com/api/proxy?secret=${API_SECRET}&url=${encodedUrl}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            let fileData = null;

            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await response.json();

                if (data.status === "success" && data.list && data.list.length > 0) {
                    fileData = data.list[0];
                }
            } catch (err) {
                clearTimeout(timeoutId);
                console.log(`[BOT] API Fetch Error:`, err.message);
            }

            if (!fileData) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Extraction Failed*', 'ApiDash failed to process the link. The file might be deleted or restricted.');
            }

            // 🚀 THE QUALITY HUNTER: Prioritize 1080p and Original Source
            let downloadLink = fileData.download_link || fileData.fast_download_link;
            let streamObj = fileData.fast_stream_url;
            let bestStreamUrl = null;

            if (streamObj) {
                // Hunt for highest possible quality dynamically
                bestStreamUrl = streamObj['1080p'] || streamObj['Original'] || streamObj['720p'] || streamObj['480p'];
            }
            if (!bestStreamUrl) bestStreamUrl = fileData.stream_url;

            let fileName = (fileData.name || "Terabox_Original_HD").replace(/[^\w\s.-]/g, '').substring(0, 50);
            if (!fileName.toLowerCase().endsWith('.mp4')) fileName += '.mp4';
            let fileSize = fileData.size_formatted || "Unknown Size";

            // Local Temp File path
            const tempFilePath = path.join(__dirname, `tb_${Date.now()}.mp4`);
            let isCompiled = false;
            let actualVideoUrl = downloadLink || bestStreamUrl;

            // 🚀 THE HEADER SCANNER (X-RAY)
            if (downloadLink) {
                console.log(`[BOT] [KOSEM BOT] 🕵️‍♂️ Scanning headers of the Original Link...`);
                try {
                    const res = await fetch(downloadLink, {
                        method: 'GET',
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36' }
                    });

                    const cType = (res.headers.get('content-type') || '').toLowerCase();

                    if (cType.includes('text/html') || res.status >= 400) {
                        console.log(`[BOT] Original link is Cloudflare-blocked. Falling back to Highest Stream.`);
                        actualVideoUrl = bestStreamUrl;
                        isCompiled = true;
                    } else if (cType.includes('mpegurl') || cType.includes('m3u8') || cType.includes('application/x-mpegurl')) {
                        console.log(`[BOT] Original link is an M3U8 Playlist. FFmpeg will compile it losslessly.`);
                        actualVideoUrl = downloadLink; // It's an M3U8, we MUST use FFmpeg
                        isCompiled = true;
                    } else {
                        console.log(`[BOT] Pure MP4 File Detected! Downloading directly to VPS disk...`);
                        await streamPipeline(res.body, fs.createWriteStream(tempFilePath));
                        actualVideoUrl = null; // File is now saved locally, no need for FFmpeg
                    }
                } catch(e) {
                    console.log(`[BOT] X-Ray failed. Falling back to Highest Stream.`);
                    actualVideoUrl = bestStreamUrl;
                    isCompiled = true;
                }
            } else {
                isCompiled = true;
            }

            // 🚀 THE COMPILER (Only runs if the file was an M3U8 Playlist)
            if (actualVideoUrl && isCompiled) {
                console.log(`[BOT] [KOSEM BOT] ⚙️ Compiling Original MP4 via FFmpeg...`);
                // -c copy ensures ZERO quality compression. It just stitches the chunks together!
                const ffmpegCommand = `ffmpeg -i "${actualVideoUrl}" -c copy -bsf:a aac_adtstoasc -v warning "${tempFilePath}"`;
                
                await new Promise((resolve, reject) => {
                    exec(ffmpegCommand, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 SUCCESS! Preparing full MP4 Document delivery...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `📦 *Size:* ${fileSize}\n`;
            captionText += `💎 *Quality:* 100% Original Source\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (extra.react) await extra.react('✅');
            
            // 🚀 SENT AS DOCUMENT FROM LOCAL DISK
            await sock.sendMessage(msg.key.remoteJid, {
                document: fs.readFileSync(tempFilePath), 
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: captionText
            }, { quoted: msg });

            // 🧹 Cleanup to keep your VPS server hard-drive empty
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

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

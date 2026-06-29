/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * ApiDash VIP + FFmpeg Compiler Edition
 * Converts HLS/M3U8 Stream Playlists into Real Offline MP4 files.
 */

const config = require('../../config');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const processedMessages = new Set();

// 🔑 Gohar's Private API Key
const API_SECRET = "pk_h1upjqkb1ic3igwq8f3n4"; 

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Compile and Download Original MP4 via FFmpeg',
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
            await sendMsg(sock, msg, extra, '⏳ *Analyzing Media...*', 'Connecting to ApiDash to extract media streams...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target URL: ${targetUrl}`);

            const encodedUrl = encodeURIComponent(targetUrl);
            const apiUrl = `https://api.playterabox.com/api/proxy?secret=${API_SECRET}&url=${encodedUrl}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            let streamUrl = null;
            let fileName = "Terabox_Compiled_HD.mp4";
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

                    // 🚀 STRICT STREAM SELECTION: We only want the 720p stream to compile
                    streamUrl = (fileData.fast_stream_url && fileData.fast_stream_url["720p"]) || 
                                (fileData.fast_stream_url && fileData.fast_stream_url["480p"]) || 
                                fileData.stream_url;

                    if (fileData.name) {
                        fileName = fileData.name.replace(/[^\w\s.-]/g, '').substring(0, 50);
                        if (!fileName.toLowerCase().endsWith('.mp4')) fileName += '.mp4';
                    }
                    if (fileData.size_formatted) fileSize = fileData.size_formatted;
                }
            } catch (err) {
                clearTimeout(timeoutId);
                console.log(`[BOT] API Fetch Error:`, err.message);
            }

            if (!streamUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Extraction Failed*', 'Could not find a valid stream to compile. The file might be private or deleted.');
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 Stream Found! Initiating FFmpeg Compiler...`);
            await sendMsg(sock, msg, extra, '⚙️ *Compiling Video...*', 'Original file hidden by Terabox. Kosem Bot is downloading and stitching stream chunks into a real MP4. Please wait...');

            // 🚀 FFMPEG COMPILER: Downloads HLS chunks and builds a real MP4
            const tempFilePath = path.join(__dirname, `tb_${Date.now()}.mp4`);
            
            // The -c copy command builds the MP4 instantly without re-encoding quality
            const ffmpegCommand = `ffmpeg -i "${streamUrl}" -c copy -bsf:a aac_adtstoasc -v warning "${tempFilePath}"`;

            try {
                await new Promise((resolve, reject) => {
                    exec(ffmpegCommand, (error, stdout, stderr) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                console.log(`[BOT] [KOSEM BOT] 🟢 Compilation Complete: ${tempFilePath}`);
            } catch (compileError) {
                console.log(`[BOT] FFmpeg Error:`, compileError.message);
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Compiler Failed*', 'The server failed to stitch the video. Make sure FFmpeg is installed on your Render VPS.');
            }

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `📦 *Est. Size:* ${fileSize}\n`;
            captionText += `⚙️ *Compiled from HLS Stream*\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (extra.react) await extra.react('✅');
            
            // 🚀 SEND THE COMPILED MP4 LOCAL FILE AS DOCUMENT
            await sock.sendMessage(msg.key.remoteJid, {
                document: fs.readFileSync(tempFilePath), 
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: captionText
            }, { quoted: msg });

            // Cleanup the temporary file to save server space
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

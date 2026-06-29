/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * ApiDash VIP Edition (Private Key Auth)
 * Bypasses all restrictions using playterabox premium endpoint.
 */

const config = require('../../config');
const processedMessages = new Set();

// 🔑 Gohar's Private API Key
const API_SECRET = "pk_h1upjqkb1ic3igwq8f3n4"; 

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download HD Videos using Premium PlayTerabox API',
    usage: '.tb <Terabox URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            // Anti-Spam (Prevents multiple fast requests)
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a valid Terabox link.');
            }

            // Universal Link Extractor (Catches all Terabox variants)
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(?:[a-zA-Z0-9-]+\.)?(terabox|1024tera|1024terabox|freeterabox|4funbox|nephobox|momerybox|teraboxapp|diskwala|mirrobox)\.(com|app|net)\/[^\s]+/i);
            
            if (!urlMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Make sure the link is a valid Terabox or Diskwala URL.');
            }

            const targetUrl = urlMatch[0];

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Authenticating VIP Key...*', 'Connecting to Premium API to fetch your video. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target URL: ${targetUrl}`);
            console.log(`[BOT] [KOSEM BOT] 🔑 Hitting PlayTerabox API...`);

            // 🚀 VIP API ENGINE (Using your ApiDash Key)
            const encodedUrl = encodeURIComponent(targetUrl);
            const apiUrl = `https://api.playterabox.com/api/proxy?secret=${API_SECRET}&url=${encodedUrl}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 Seconds limit

            let finalVideoUrl = null;
            let fileName = "Terabox_Premium_HD.mp4";
            let fileSize = "Unknown Size";

            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                const data = await response.json();

                // ⚙️ Validating the Schema you provided
                if (data.status === "success" && data.list && data.list.length > 0) {
                    const fileData = data.list[0];

                    // Priority 1: Fast Download Link, Priority 2: Normal Link, Priority 3: 720p Stream
                    finalVideoUrl = fileData.fast_download_link || 
                                    fileData.download_link || 
                                    (fileData.fast_stream_url && fileData.fast_stream_url["720p"]);
                    
                    if (fileData.name) {
                        fileName = fileData.name.replace(/[^\w\s.-]/g, '').substring(0, 50); // Clean name
                        if (!fileName.endsWith('.mp4')) fileName += '.mp4';
                    }

                    if (fileData.size_formatted) {
                        fileSize = fileData.size_formatted;
                    }
                } else {
                    console.log(`[BOT] API Response Failed/Invalid:`, data);
                }

            } catch (err) {
                clearTimeout(timeoutId);
                console.log(`[BOT] API Fetch Error:`, err.message);
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Extraction Failed*', 'The API could not extract the video. The file might be deleted or requires a password.');
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 SUCCESS! Sending Document to WhatsApp...`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `📦 *Size:* ${fileSize}\n`;
            captionText += `🔐 *Authorized via VIP Key*\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY AS DOCUMENT (No compression, Original Quality)
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

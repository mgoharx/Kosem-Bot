/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * V9 SIGNATURE BYPASS EDITION (Error 105 Fix)
 * Extracts hidden 'sign' and 'timestamp' to bypass Terabox internal security
 */

const config = require('../../config');
const processedMessages = new Set();

// 🚀 GOHAR'S PERSONAL MASTER KEYS
const RAW_COOKIES = "ndus=Yv3DfdNpeHuiOa4q0Db3WGIcUaZaFGBpUwfSzjm6; browserid=sISE3M5XH6Aduh9foeP5C7kyIGQflQ6EKbWAKMzkI9VZyE4InIjMyL_M1BQ=; csrfToken=Ha_vsoPkcoXOVhQlkXwXjys4; ndut_fmt=0DD3F74080FB881855F22B73CAF421377B881A00C3051422F109DD2E0C32FAED;";

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download HD Videos using Signature Bypass & Private Cookie',
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
                return await sendMsg(sock, msg, extra, '❌ *Link Missing*', 'Please provide a Terabox link.');
            }

            const idMatch = text.match(/\/s\/([a-zA-Z0-9_.-]+)/);
            if (!idMatch) {
                return await sendMsg(sock, msg, extra, '❌ *Invalid Link*', 'Ensure the link contains /s/ (e.g., terabox.com/s/1xyz).');
            }

            const shortId = idMatch[1];
            const cleanUrl = `https://www.terabox.app/s/${shortId}`; // Use .app for better mobile spoofing

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Authenticating...*', 'Extracting JS Signatures and Injecting private session cookies. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target ID: ${shortId}`);

            // ==========================================
            // 🚀 PHASE 1: PRE-FLIGHT (Extracting Signatures)
            // ==========================================
            console.log(`[BOT] [KOSEM BOT] 🕵️‍♂️ Phase 1: Fetching hidden signatures...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            let signature = null;
            let timestamp = null;
            let finalVideoUrl = null;
            let fileName = "Terabox_VIP_HD.mp4";

            try {
                // Fetch the main page as a mobile user to get the JS variables
                const pageRes = await fetch(cleanUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                        'Cookie': RAW_COOKIES,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                    },
                    signal: controller.signal
                });
                
                const pageHtml = await pageRes.text();
                
                // Extract sign and timestamp from window.yunData
                const signMatch = pageHtml.match(/"sign":"([^"]+)"/);
                const timestampMatch = pageHtml.match(/"timestamp":([0-9]+)/);
                
                // Extract default Dlink as a backup (sometimes Terabox puts it right in the HTML)
                const dlinkMatch = pageHtml.match(/"dlink":"([^"]+)"/);
                if (dlinkMatch) {
                    finalVideoUrl = dlinkMatch[1].replace(/\\/g, '');
                    console.log(`[BOT] [KOSEM BOT] 🟢 Found Direct Link in HTML Data!`);
                }

                const titleMatch = pageHtml.match(/"server_filename":"([^"]+)"/);
                if (titleMatch) {
                    fileName = titleMatch[1].replace(/[^\w\s.-]/g, '').substring(0, 50);
                }

                if (signMatch && timestampMatch) {
                    signature = signMatch[1];
                    timestamp = timestampMatch[1];
                    console.log(`[BOT] [KOSEM BOT] 🔑 Signatures Extracted: sign=${signature.substring(0,5)}..., ts=${timestamp}`);
                }

            } catch (err) {
                console.log(`[BOT] [KOSEM BOT] 🔴 Phase 1 Failed:`, err.message);
            }

            // ==========================================
            // 🚀 PHASE 2: INTERNAL API (With Signatures)
            // ==========================================
            if (!finalVideoUrl && signature && timestamp) {
                console.log(`[BOT] [KOSEM BOT] 🚀 Phase 2: Hitting Internal API with Signatures...`);
                try {
                    // We must pass sign, timestamp, and shorturl to avoid Error 105
                    const apiUrl = `https://www.terabox.app/share/list?app_id=250528&shorturl=${shortId}&root=1&sign=${signature}&timestamp=${timestamp}`;
                    
                    const apiRes = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                            'Cookie': RAW_COOKIES,
                            'Accept': 'application/json, text/plain, */*'
                        }
                    });
                    
                    const data = await apiRes.json();
                    
                    if (data.errno === 0 && data.list && data.list.length > 0) {
                        finalVideoUrl = data.list[0].dlink;
                        fileName = (data.list[0].server_filename || fileName).replace(/[^\w\s.-]/g, '').substring(0, 50);
                        console.log(`[BOT] [KOSEM BOT] 🟢 Success via Internal API!`);
                    } else {
                        console.log(`[BOT] Internal Error:`, data);
                    }
                } catch (err) {
                    console.log(`[BOT] [KOSEM BOT] 🔴 Phase 2 Failed:`, err.message);
                }
            }
            
            clearTimeout(timeoutId);

            // ==========================================
            // 🚀 PHASE 3: FALLBACK ENGINE (If Terabox completely blocked us)
            // ==========================================
            if (!finalVideoUrl) {
                console.log(`[BOT] [KOSEM BOT] ⚠️ Fallback Engine Activated...`);
                try {
                    const fallbackRes = await fetch(`https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${shortId}`);
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.list && fallbackData.list[0]) {
                        finalVideoUrl = fallbackData.list[0].dlink || fallbackData.list[0].hdplay;
                        fileName = fallbackData.list[0].filename || fileName;
                        console.log(`[BOT] [KOSEM BOT] 🟢 Success via Fallback!`);
                    }
                } catch (e) {
                     console.log(`[BOT] [KOSEM BOT] 🔴 Fallback Failed.`);
                }
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Authentication Failed*', 'Terabox rejected the request (Error 105). The file might require an explicit password, or the cookies have expired.');
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 JACKPOT! Authorized direct link generated.`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `🔐 *Authorized via Private Key & Signature*\n`;
            captionText += `✨ *Downloaded by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY AS DOCUMENT
            if (extra.react) await extra.react('✅');
            
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: finalVideoUrl }, 
                mimetype: 'video/mp4',
                fileName: fileName.endsWith('.mp4') ? fileName : fileName + '.mp4',
                caption: captionText
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            return await sendMsg(sock, msg, extra, '❌ *System Error*', 'Kosem Bot encountered an internal crash.');
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

/**
 * 👑 Kosem Bot Premium Terabox Downloader
 * V10 MOBILE APP SIMULATOR (Anti-Cloudflare Edition)
 * Bypasses HTML Turnstile by spoofing the official Android App API
 */

const config = require('../../config');
const processedMessages = new Set();

// 🚀 GOHAR'S PERSONAL MASTER KEYS
const RAW_COOKIES = "ndus=Yv3DfdNpeHuiOa4q0Db3WGIcUaZaFGBpUwfSzjm6; browserid=sISE3M5XH6Aduh9foeP5C7kyIGQflQ6EKbWAKMzkI9VZyE4InIjMyL_M1BQ=; csrfToken=Ha_vsoPkcoXOVhQlkXwXjys4; ndut_fmt=0DD3F74080FB881855F22B73CAF421377B881A00C3051422F109DD2E0C32FAED;";

module.exports = {
    name: 'terabox',
    aliases: ['tb', 'teradl', 'dw', 'diskwala'],
    category: 'media',
    description: 'Download HD Videos by simulating the Terabox Android App',
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

            if (extra.react) await extra.react('⏳');
            await sendMsg(sock, msg, extra, '⏳ *Authenticating Device...*', 'Simulating Terabox Android App to bypass Cloudflare. Please wait...');

            console.log(`[BOT] [KOSEM BOT] 🟢 Target ID: ${shortId}`);
            console.log(`[BOT] [KOSEM BOT] 📱 Spoofing as Android App Endpoint...`);

            // ==========================================
            // 🚀 APP SIMULATION FETCH (No HTML, No Captcha)
            // ==========================================
            const fetchMobileAPI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            // Spoofing the exact User-Agent of the Terabox Mobile App
                            'User-Agent': 'Terabox/3.4.0 (Linux; U; Android 14; en-US; SM-S928B; Build/UP1A.231005.007)',
                            'Cookie': RAW_COOKIES,
                            'Accept': 'application/json',
                            'X-Requested-With': 'com.dubox.drive' // Official App Package Name
                        },
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    return await response.json();
                } catch (e) {
                    clearTimeout(timeoutId);
                    console.log(`[BOT] Fetch error on Mobile API:`, e.message);
                    return null;
                }
            };

            let finalVideoUrl = null;
            let fileName = "Terabox_Mobile_HD.mp4";

            // Endpoint 1: The shorturlinfo mobile API
            const api1 = `https://www.terabox.app/api/shorturlinfo?app_id=250528&shorturl=${shortId}&root=1`;
            console.log(`[BOT] [KOSEM BOT] Hitting Mobile Endpoint 1...`);
            let data1 = await fetchMobileAPI(api1);

            if (data1 && data1.list && data1.list.length > 0) {
                finalVideoUrl = data1.list[0].dlink || data1.list[0].file_link;
                fileName = (data1.list[0].server_filename || fileName).replace(/[^\w\s.-]/g, '').substring(0, 50);
            }

            // Endpoint 2: The share list mobile API
            if (!finalVideoUrl) {
                const api2 = `https://www.terabox.app/share/list?app_id=250528&shorturl=${shortId}&root=1`;
                console.log(`[BOT] [KOSEM BOT] Hitting Mobile Endpoint 2...`);
                let data2 = await fetchMobileAPI(api2);
                
                if (data2 && data2.list && data2.list.length > 0) {
                    finalVideoUrl = data2.list[0].dlink || data2.list[0].file_link;
                    fileName = (data2.list[0].server_filename || fileName).replace(/[^\w\s.-]/g, '').substring(0, 50);
                }
            }

            // Endpoint 3: Public Fallback without cookies (just in case)
            if (!finalVideoUrl) {
                console.log(`[BOT] [KOSEM BOT] Hitting External Fallback...`);
                try {
                    const fallbackRes = await fetch(`https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=${shortId}`);
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData && fallbackData.list && fallbackData.list[0]) {
                        finalVideoUrl = fallbackData.list[0].dlink || fallbackData.list[0].hdplay;
                        fileName = fallbackData.list[0].filename || fileName;
                    }
                } catch(e) {}
            }

            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                return await sendMsg(sock, msg, extra, '❌ *Cloudflare Blocked*', 'Terabox is strictly blocking Render Data Center IPs today. Even the mobile endpoints were rejected.');
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 SUCCESS! App simulation bypassed the security.`);

            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐓𝐄𝐑𝐀𝐁𝐎𝐗 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `📱 *Bypassed via Mobile App Tunnel*\n`;
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

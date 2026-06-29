/**
 * 👑 Kosem Bot Premium DiskWala Downloader
 * V2 Elite Bypass - Fresh APIs & Anti-Cloudflare Headers
 */

const config = require('../../config');

const processedMessages = new Set();

module.exports = {
    name: 'diskwala',
    aliases: ['dw', 'diskwaladl', 'dwdownload', 'terabox'],
    category: 'media',
    description: 'Download Full HD Videos from DiskWala/Terabox',
    usage: '.diskwala <DiskWala URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            // Anti-Spam System
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Link Missing*\n`;
                errText += `💡 Please provide a valid DiskWala link.\n`;
                errText += `✦ *Example:* \`.dw https://diskwala.com/...\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // Extract DiskWala or Terabox URL
            const urlMatch = text.match(/https?:\/\/(?:www\.)?(diskwala\.(com|app)|terabox\.com|teraboxapp\.com|1024tera\.com|freeterabox\.com)\/[^\s]+/i);
            const url = urlMatch ? urlMatch[0] : null;

            if (!url) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Link*\n`;
                errText += `💡 That is not a valid DiskWala or Terabox link.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Spoofing Servers & Extracting File...*\n`;
            waitText += `💡 Bypassing Cloudflare security to get the Full HD source.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            // 🚀 SMART PARSER
            const extractVideoUrl = (obj) => {
                if (typeof obj === 'string' && obj.startsWith('http') && !obj.includes('.jpg') && !obj.includes('.png')) return obj;
                if (typeof obj === 'object' && obj !== null) {
                    const keysToCheck = ['video', 'videoUrl', 'url', 'hdplay', 'download', 'file', 'link', 'fast_download'];
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

            // 🚀 BROWSER SIMULATION WITH ELITE ANTI-CLOUDFLARE HEADERS
            const fetchFromAI = async (apiUrl) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s Timeout

                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        redirect: 'follow',
                        signal: controller.signal,
                        headers: {
                            // Spoofing as a real Windows Chrome User
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                            'Sec-Ch-UaNormally I can help with things like this, but I don't seem to have access to that content. You can try again or ask me for something else.

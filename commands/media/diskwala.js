/**
 * 👑 Kosem Bot Premium DiskWala/Terabox Downloader
 * V5 "NATIVE SCRAPER" - Zero Third-Party APIs
 * Scrapes HTML directly to find hidden MP4 links.
 */

const config = require('../../config');

const processedMessages = new Set();

module.exports = {
    name: 'diskwala',
    aliases: ['dw', 'diskwaladl', 'dwdownload', 'terabox', 'tb'],
    category: 'media',
    description: 'Direct Native HTML Scraper for DiskWala/Terabox',
    usage: '.dw <DiskWala URL>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (processedMessages.has(msg.key.id)) return;
            processedMessages.add(msg.key.id);
            setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text ||
                         args.join(' ');

            if (!text) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Link Missing*\n`;
                errText += `💡 Please provide a valid DiskWala or Terabox link.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            const urlMatch = text.match(/https?:\/\/(?:www\.)?(diskwala\.(com|app)|terabox\.com|teraboxapp\.com|1024tera\.com|freeterabox\.com)\/s\/([a-zA-Z0-9_-]+)/i);
            
            if (!urlMatch) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Link Format*\n`;
                errText += `💡 Ensure the link contains '/s/'. (e.g., diskwala.com/s/1xyz)\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            const shortId = urlMatch[3]; // Extract the unique video ID (e.g., 1xyz...)
            const targetUrl = `https://www.terabox.app/s/${shortId}`; // Converting Diskwala to Official Domain

            if (extra.react) await extra.react('⏳');

            let waitText = `❖ ───── ✦ 𝐍𝐀𝐓𝐈𝐕𝐄 𝐄𝐍𝐆𝐈𝐍𝐄 ✦ ───── ❖\n\n`;
            waitText += `⏳ *Direct HTML Scraping Started...*\n`;
            waitText += `💡 Bypassing APIs. Kosem Bot is directly analyzing DiskWala's source code to hunt for the video.\n`;
            waitText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await sock.sendMessage(msg.key.remoteJid, { text: waitText }, { quoted: msg });

            console.log(`[BOT] [KOSEM BOT] 🟢 Native Scraper Initiated for ID: ${shortId}`);

            // 🚀 PURE NATIVE FETCH (No APIs!)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s Timeout

            let rawHTML = "";
            try {
                const response = await fetch(targetUrl, {
                    method: 'GET',
                    redirect: 'follow',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });
                
                clearTimeout(timeoutId);
                rawHTML = await response.text();
            } catch (err) {
                clearTimeout(timeoutId);
                throw new Error("Direct connection to Terabox servers failed.");
            }

            console.log(`[BOT] [KOSEM BOT] ✅ Page HTML downloaded. Length: ${rawHTML.length} characters.`);

            // 🛑 CLOUDFLARE BLOCK CHECK
            if (rawHTML.includes('Just a moment...') || rawHTML.includes('cf-browser-verification') || rawHTML.includes('Cloudflare')) {
                console.log(`[BOT] [KOSEM BOT] 🔴 Render IP was blocked by Cloudflare Captcha.`);
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Cloudflare Firewall*\n`;
                errText += `💡 Kosem Bot tried to read the page, but DiskWala's Cloudflare detected the bot's server (Render IP) and threw a Captcha block.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // 🚀 HUNTING FOR THE SECRET LINKS IN HTML
            console.log(`[BOT] [KOSEM BOT] 🟢 Scanning HTML for hidden video URLs...`);
            
            let finalVideoUrl = null;
            let fileName = "DiskWala_Direct_Video.mp4";

            // Method 1: Look for raw .mp4 links injected in scripts
            const mp4Regex = /(https?:\/\/[^\s"'<>]+(?:dlink|play|video)[^\s"'<>]+)/g;
            const matches = rawHTML.match(mp4Regex);
            
            if (matches && matches.length > 0) {
                for (let link of matches) {
                    if (!link.includes('.jpg') && !link.includes('.png') && !link.includes('avatar')) {
                        // Decode unicode escapes (e.g., \u0026 -> &)
                        finalVideoUrl = link.replace(/\\u0026/g, '&').replace(/\\/g, '');
                        break;
                    }
                }
            }

            // Method 2: Look for Terabox sharedData variable
            if (!finalVideoUrl) {
                const titleMatch = rawHTML.match(/"server_filename":"([^"]+)"/);
                if (titleMatch) fileName = titleMatch[1];

                const linkMatch = rawHTML.match(/"dlink":"([^"]+)"/);
                if (linkMatch) finalVideoUrl = linkMatch[1].replace(/\\/g, '');
            }

            // 🛑 If No Link Found in HTML
            if (!finalVideoUrl) {
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Scraping Failed*\n`;
                errText += `💡 Kosem Bot successfully loaded the page, but DiskWala has heavily encrypted the video link using JavaScript. Native bypass failed.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 JACKPOT! Native Scraper found the link!`);
            
            const botName = config?.botName ? config.botName.toUpperCase() : 'KOSEM BOT';
            let captionText = `❖ ───── ✦ 𝐃𝐈𝐒𝐊𝐖𝐀𝐋𝐀 ✦ ───── ❖\n\n`;
            captionText += `🎬 *File:* ${fileName.replace('.mp4', '')}\n`;
            captionText += `✨ *Scraped Natively by ${botName}*\n`;
            captionText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // 🚀 FINAL DELIVERY
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
            
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *System Crash*\n`;
            errText += `💡 Native Scraper encountered a critical error during execution.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

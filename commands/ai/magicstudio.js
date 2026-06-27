/**
 * Magic Studio & Pollinations AI Image Generation Command
 * 100% Free - Native Fetch Engine (Cloudflare Bypass)
 * Ultra HD Quality & Flux Model Activated
 */

module.exports = {
    name: 'imagine',
    aliases: ['magic', 'magicai', 'aiimage', 'generate', 'magicstudio'],
    category: 'ai',
    desc: 'Generate HD AI art from a text prompt',
    usage: '.imagine <prompt>',
    
    execute: async (sock, msg, args, extra) => {
        try {
            const prompt = args.join(' ').trim();
            
            if (!prompt) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Prompt Missing*\n`;
                errText += `💡 Please describe the image you want to generate.\n`;
                errText += `✦ *Example:* \`.imagine a highly detailed 4k cyberpunk city, neon lights, hyperrealistic\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await extra.reply(errText);
            }
            
            if (extra.react) await extra.react('⏳');

            // 🚀 BROWSER SIMULATION: Bypasses Host/VPS and Cloudflare Blocks
            const fetchImageBuffer = async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow', 
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        'Connection': 'keep-alive'
                    }
                });

                if (!response.ok) {
                    throw new Error(`API rejected request with status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error("Cloudflare blocked the request (Received HTML instead of image).");
                }

                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            };

            // 🚀 MULTI-API FALLBACK SYSTEM (Ultra HD Endpoints)
            const apis = [
                {
                    name: "Pollinations AI (Flux HD)",
                    // 🛠️ FIX: Added High-Res parameters & Flux Model for Ultra Quality!
                    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true&model=flux`
                },
                {
                    name: "Magic Studio (Siputzx)",
                    url: `https://api.siputzx.my.id/api/ai/magicstudio?prompt=${encodeURIComponent(prompt)}`
                }
            ];

            let imageBuffer = null;
            let usedApiName = '';

            // ⚙️ THE HACKER LOOP: Try fetching the image silently
            for (let api of apis) {
                try {
                    console.log(`[AI IMAGE] Generating HD image via ${api.name}...`);
                    const buffer = await fetchImageBuffer(api.url);
                    
                    if (buffer && buffer.length > 10240) {
                        imageBuffer = buffer;
                        usedApiName = api.name;
                        console.log(`[AI IMAGE] 🟢 Success from ${api.name}!`);
                        break; 
                    }
                } catch (err) {
                    console.log(`[AI IMAGE] 🔴 ${api.name} failed: ${err.message}. Trying next...`);
                    continue; 
                }
            }

            if (!imageBuffer) {
                if (extra.react) await extra.react('❌');
                return await extra.reply("❌ *Host Restricted:* Your VPS is currently blacklisted, and all image generation APIs blocked the request. Please try again later.");
            }

            const maxImageSize = 10 * 1024 * 1024; 
            if (imageBuffer.length > maxImageSize) {
                if (extra.react) await extra.react('❌');
                return await extra.reply(`❌ *Error:* Generated HD image is too large to send (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB).`);
            }

            // 🚀 Final Delivery to User
            const captionText = `🎨 *HD AI Image Generated*\n💬 *Prompt:* ${prompt}\n🤖 *Engine:* ${usedApiName}`;
            
            if (extra.react) await extra.react('✅');
            
            // Sending as a standard image (WhatsApp might compress it slightly)
            await sock.sendMessage(extra.from, { 
                image: imageBuffer, 
                caption: captionText 
            }, { quoted: msg });
            
        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            
            if (extra.react) await extra.react('❌');
            
            if (error.message.includes('fetch is not defined')) {
                await extra.reply('❌ Your VPS is running an outdated version of Node.js. Please update to Node.js 18 or higher.');
            } else {
                await extra.reply('❌ Bot system crashed during image generation. The process timed out.');
            }
        }
    }
};

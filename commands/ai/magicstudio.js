/**
 * Magic Studio & Pollinations AI Image Generation Command
 * 100% Free - Native Fetch Engine (Cloudflare Bypass)
 */

module.exports = {
    name: 'imagine',
    aliases: ['magic', 'magicai', 'aiimage', 'generate', 'magicstudio'],
    category: 'ai',
    desc: 'Generate AI art from a text prompt',
    usage: '.imagine <prompt>',
    
    execute: async (sock, msg, args, extra) => {
        try {
            const prompt = args.join(' ').trim();
            
            if (!prompt) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Prompt Missing*\n`;
                errText += `💡 Please describe the image you want to generate.\n`;
                errText += `✦ *Example:* \`.imagine a futuristic cyberpunk city at night\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await extra.reply(errText);
            }
            
            if (extra.react) await extra.react('⏳');

            // 🚀 BROWSER SIMULATION: Bypasses Host/VPS and Cloudflare Blocks
            const fetchImageBuffer = async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow', // Crucial for bypassing 301/302 redirects
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        'Connection': 'keep-alive'
                    }
                });

                if (!response.ok) {
                    throw new Error(`API rejected request with status: ${response.status}`);
                }

                // Check if Cloudflare blocked it and returned an HTML page instead of an image
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error("Cloudflare blocked the request (Received HTML instead of image).");
                }

                // Convert response to Buffer for WhatsApp
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            };

            // 🚀 MULTI-API FALLBACK SYSTEM (100% Free Endpoints)
            const apis = [
                {
                    name: "Pollinations AI",
                    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&enhance=true`
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
                    console.log(`[AI IMAGE] Generating via ${api.name}...`);
                    const buffer = await fetchImageBuffer(api.url);
                    
                    // Verify the buffer is actually an image (larger than 10KB)
                    if (buffer && buffer.length > 10240) {
                        imageBuffer = buffer;
                        usedApiName = api.name;
                        console.log(`[AI IMAGE] 🟢 Success from ${api.name}!`);
                        break; // Stop looking, we got the image!
                    }
                } catch (err) {
                    console.log(`[AI IMAGE] 🔴 ${api.name} failed: ${err.message}. Trying next...`);
                    continue; 
                }
            }

            // 🛑 Error Handling if all APIs fail
            if (!imageBuffer) {
                if (extra.react) await extra.react('❌');
                return await extra.reply("❌ *Host Restricted:* Your VPS is currently blacklisted, and all image generation APIs blocked the request. Please try again later.");
            }

            // Check file size (WhatsApp image limit is around 5MB to 16MB depending on the format)
            const maxImageSize = 10 * 1024 * 1024; // Upped to 10MB just to be safe
            if (imageBuffer.length > maxImageSize) {
                if (extra.react) await extra.react('❌');
                return await extra.reply(`❌ *Error:* Generated image is too large to send (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB).`);
            }

            // 🚀 Final Delivery to User
            const captionText = `🎨 *AI Image Generated*\n💬 *Prompt:* ${prompt}`;
            
            if (extra.react) await extra.react('✅');
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

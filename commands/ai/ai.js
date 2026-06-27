module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: '100% Free AI (Native Fetch - Anti Cloudflare)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Sawal Missing*\n`;
                errText += `💡 Bhai, koi sawal likhein.\n`;
                errText += `✦ *Example:* \`.ai who is the founder of Pakistan?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const prompt = args.join(' ');
            if (extra.react) await extra.react('⏳');

            // 🚀 BROWSER SIMULATION: Native fetch looks exactly like a real browser
            const fetchFromAI = async (url, isJson = true) => {
                const response = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow', // Automatically follows redirects
                    headers: {
                        // The ultimate anti-block headers
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Cloudflare blocked with status: ${response.status}`);
                }

                const data = await (isJson ? response.json() : response.text());
                return data;
            };

            // 🚀 THE FREE API LIST (Highly Stable endpoints)
            const apis = [
                {
                    name: "Pollinations Engine",
                    url: `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
                    isJson: false,
                    parse: (data) => data // Directly returns text
                },
                {
                    name: "AEMT GPT",
                    url: `https://aemt.me/prompt/gpt?prompt=${encodeURIComponent(prompt)}`,
                    isJson: true,
                    parse: (data) => data.result || data.message
                },
                {
                    name: "BK9 AI",
                    url: `https://bk9.site/ai/gemini?q=${encodeURIComponent(prompt)}`,
                    isJson: true,
                    parse: (data) => data.BK9
                }
            ];

            let finalAnswer = null;

            // ⚙️ THE HACKER LOOP: Try every API secretly
            for (let api of apis) {
                try {
                    console.log(`[AI] Bypassing security via ${api.name}...`);
                    const rawData = await fetchFromAI(api.url, api.isJson);
                    
                    // HTML/Cloudflare check
                    if (typeof rawData === 'string' && (rawData.includes('<!DOCTYPE html') || rawData.includes('<html'))) {
                        throw new Error("Received HTML Cloudflare block.");
                    }

                    const answer = api.parse(rawData);
                    
                    if (answer && answer.length > 2) {
                        finalAnswer = answer;
                        console.log(`[AI] 🟢 Success from ${api.name}!`);
                        break; // Stop looking, we got the answer
                    }
                } catch (err) {
                    console.log(`[AI] 🔴 ${api.name} failed: ${err.message}. Trying next...`);
                    continue; 
                }
            }

            // 🚀 Final Delivery to User
            if (finalAnswer) {
                // Clean up any promotional text from the APIs
                finalAnswer = finalAnswer.replace(/BK9|AEMT/ig, 'Kosem AI').trim();
                
                if (extra.react) await extra.react('✅');
                await extra.reply(finalAnswer);
            } else {
                if (extra.react) await extra.react('❌');
                await extra.reply("❌ *Host Restricted:* Bhai, aapke VPS ka IP itna badnaam (blacklisted) hai ke internet ki saari APIs ne usay block kar diya hai. Aapko bot kisi aur panel par host karna parega.");
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            
            // Failsafe if Node version is too old for fetch()
            if (error.message.includes('fetch is not defined')) {
                await extra.reply('❌ Aapke VPS ka Node.js version bohot purana hai. Please Node.js 18 ya is se oopar update karein.');
            } else {
                await extra.reply('❌ Bot system crashed during execution.');
            }
        }
    }
};

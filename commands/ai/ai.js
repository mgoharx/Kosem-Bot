const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: '100% Free Keyless AI (Direct IP Bypass)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Sawal Missing*\n`;
                errText += `💡 Bhai, koi sawal likhein.\n`;
                errText += `✦ *Example:* \`.ai what is programming?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const prompt = args.join(' ');
            if (extra.react) await extra.react('⏳');

            // 🚀 ARRAY OF 100% FREE APIs (NO KEYS REQUIRED)
            // Hardcoded Direct IPs to completely bypass "ENOTFOUND" and DNS issues!
            const freeAPIs = [
                {
                    name: "Pollinations AI",
                    ip: "104.21.23.208", // Direct Cloudflare IP
                    host: "text.pollinations.ai",
                    path: `/${encodeURIComponent(prompt)}`,
                    parse: (raw) => raw // Returns plain text directly
                },
                {
                    name: "Siputzx GPT",
                    ip: "104.21.65.176", // Direct Cloudflare IP
                    host: "api.siputzx.my.id",
                    path: `/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`,
                    parse: (raw) => JSON.parse(raw).data
                },
                {
                    name: "Worker AI",
                    ip: "104.21.84.237", // Direct Cloudflare IP
                    host: "chatgpt.apinepdev.workers.dev",
                    path: `/?question=${encodeURIComponent(prompt)}`,
                    parse: (raw) => JSON.parse(raw).answer
                }
            ];

            const fetchAI = (api) => {
                return new Promise((resolve, reject) => {
                    const options = {
                        hostname: api.ip, 
                        port: 443,
                        path: api.path,
                        method: 'GET',
                        headers: {
                            'Host': api.host, 
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
                        },
                        servername: api.host, // 🔥 Crucial for bypassing VPS SSL Blocks
                        rejectUnauthorized: false, // 🔥 Ignores strict panel security
                        timeout: 15000 // 15 seconds wait time
                    };

                    const req = https.request(options, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            try {
                                const answer = api.parse(data);
                                if (answer && answer.length > 2) {
                                    resolve(answer);
                                } else {
                                    reject(new Error("Empty response from API"));
                                }
                            } catch (e) {
                                reject(new Error("Failed to parse AI response"));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error("API Timeout"));
                    });
                    req.end();
                });
            };

            let finalAnswer = null;

            // ⚙️ LOOP: Ek fail hua toh doosra khud try karega!
            for (let api of freeAPIs) {
                try {
                    console.log(`[AI] Attempting ${api.name} via Direct IP...`);
                    finalAnswer = await fetchAI(api);
                    
                    if (finalAnswer) {
                        console.log(`[AI] Success! Answer provided by ${api.name}`);
                        break; // Stop the loop if answer is found
                    }
                } catch (err) {
                    console.log(`[AI] ${api.name} failed (${err.message}). Trying next...`);
                    continue; 
                }
            }

            // 🚀 Final Result Delivery
            if (finalAnswer) {
                // Remove promotional texts from free APIs
                finalAnswer = finalAnswer.replace(/Siputzx|Worker|Nyxs|BK9/ig, 'AI').trim();
                
                if (extra.react) await extra.react('✅');
                await extra.reply(finalAnswer);
            } else {
                if (extra.react) await extra.react('❌');
                await extra.reply("❌ *Network Error:* Bhai, maine 3 alag AI servers par direct IP se connect karne ki koshish ki, lekin aapke hosting panel ne bahar jane wali sari traffic sakhti se block ki hui hai.");
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ Bot command crashed due to an internal error.');
        }
    }
};

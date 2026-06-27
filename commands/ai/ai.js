const https = require('https');
const url = require('url');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: '100% Free Auto-Redirecting AI',
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

            // 🚀 BROWSER ENGINE: Yeh function 301/302 Redirects ko khud follow karta hai!
            const fetchWithRedirect = (requestUrl, redirectCount = 0) => {
                return new Promise((resolve, reject) => {
                    // Agar website 5 baar se zyada redirect kare, toh loop rok do
                    if (redirectCount > 5) {
                        return reject(new Error('Too many redirects (Loop detected)'));
                    }

                    const parsedUrl = url.parse(requestUrl);
                    
                    const options = {
                        hostname: parsedUrl.hostname,
                        path: parsedUrl.path,
                        method: 'GET',
                        rejectUnauthorized: false, // Bypasses strict SSL checks
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        },
                        timeout: 15000 
                    };

                    const req = https.request(options, (res) => {
                        // 🛠️ THE MAGIC: Agar 301 ya 302 aaye, toh nayi location par jao!
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            let newUrl = res.headers.location;
                            // Fix relative URLs
                            if (!newUrl.startsWith('http')) {
                                newUrl = `https://${parsedUrl.hostname}${newUrl}`;
                            }
                            console.log(`[AI] Redirecting to: ${newUrl}`);
                            return resolve(fetchWithRedirect(newUrl, redirectCount + 1));
                        }

                        let data = '';
                        res.on('data', chunk => data += chunk);
                        
                        res.on('end', () => {
                            if (res.statusCode === 200) {
                                resolve(data);
                            } else {
                                reject(new Error(`HTTP Status ${res.statusCode}`));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('API Timeout'));
                    });
                    req.end();
                });
            };

            // 🚀 100% FREE APIs (No Keys Required)
            const freeAPIs = [
                {
                    name: "Ryzendesu AI",
                    url: `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(prompt)}`,
                    parse: (raw) => JSON.parse(raw).response
                },
                {
                    name: "Vreden AI",
                    url: `https://api.vreden.web.id/api/openai?text=${encodeURIComponent(prompt)}`,
                    parse: (raw) => JSON.parse(raw).result
                },
                {
                    name: "Nyxs GPT",
                    url: `https://api.nyxs.pw/ai/gpt4?text=${encodeURIComponent(prompt)}`,
                    parse: (raw) => JSON.parse(raw).result
                }
            ];

            let finalAnswer = null;

            // ⚙️ THE LOOP: Tries APIs one by one silently
            for (let api of freeAPIs) {
                try {
                    console.log(`[AI ENGINE] Trying ${api.name}...`);
                    const rawData = await fetchWithRedirect(api.url);
                    
                    // Agar galti se HTML aa jaye, toh reject kar do
                    if (rawData.includes('<html') || rawData.includes('CloudFront')) {
                        throw new Error("Received HTML instead of JSON");
                    }

                    const answer = api.parse(rawData);
                    
                    if (answer && answer.length > 2) {
                        finalAnswer = answer;
                        console.log(`[AI ENGINE] Success from ${api.name}!`);
                        break; // Answer mil gaya, loop rok do
                    }
                } catch (err) {
                    console.log(`[AI ENGINE] ${api.name} failed: ${err.message}. Shifting to next...`);
                    continue; 
                }
            }

            // 🚀 Final Delivery
            if (finalAnswer) {
                // Remove promotional text from free APIs
                finalAnswer = finalAnswer.replace(/Ryzendesu|Vreden|Nyxs/ig, 'Kosem AI').trim();
                
                if (extra.react) await extra.react('✅');
                await extra.reply(finalAnswer);
            } else {
                if (extra.react) await extra.react('❌');
                await extra.reply("❌ *API Error:* Sorry bhai, saari free APIs is waqt down hain ya VPS unko block kar raha hai.");
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ Bot system crashed during execution.');
        }
    }
};

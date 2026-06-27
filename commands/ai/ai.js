const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai', // 🚀 User demand: strictly 'ai' category
    description: 'Clean & Stable AI Command',
    usage: '.ai <question>',

    async execute(sock, msg, args, extra) {
        try {
            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Question Missing*\n`;
                errText += `💡 Please ask something.\n`;
                errText += `✦ *Example:* \`.ai who are you?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const question = args.join(' ');
            if (extra.react) await extra.react('⏳');

            // 🚀 STEP 1: Ultra-Clean Fetcher (No custom DNS, No forced IPv4)
            // This prevents the host from detecting unusual network activity
            const fetchAI = (url) => {
                return new Promise((resolve, reject) => {
                    const req = https.get(url, {
                        headers: { 
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        },
                        timeout: 25000 // 25 seconds tolerance
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(data));
                    });

                    req.on('error', (e) => reject(e));
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('Timeout'));
                    });
                });
            };

            let answer = '';

            // 🚀 STEP 2: Array of 3 highly stable, independent APIs
            const apis = [
                { 
                    url: `https://bk9.site/ai/gemini?q=${encodeURIComponent(question)}`, 
                    parse: (d) => JSON.parse(d).BK9 
                },
                { 
                    url: `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(question)}`, 
                    parse: (d) => JSON.parse(d).data 
                },
                { 
                    url: `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}`, 
                    parse: (d) => JSON.parse(d).response 
                }
            ];

            // 🚀 STEP 3: Fallback Loop (Tries API 1, if fails tries 2, etc.)
            for (let i = 0; i < apis.length; i++) {
                try {
                    console.log(`[AI] Sending simple request to API ${i + 1}...`);
                    const res = await fetchAI(apis[i].url);
                    const parsed = apis[i].parse(res);
                    
                    if (parsed && parsed.length > 2) {
                        answer = parsed;
                        console.log(`[AI] API ${i + 1} Success!`);
                        break; // Stop the loop if we got an answer
                    }
                } catch (e) {
                    console.log(`[AI] API ${i + 1} Failed/Timeout. Switching...`);
                    continue; // Try the next one
                }
            }

            // 🚀 STEP 4: Send Final Answer
            if (answer) {
                // Cleanup text
                answer = answer.replace(/BK9|Siputzx|Popcat/ig, 'AI').trim();
                if (extra.react) await extra.react('✅');
                await extra.reply(answer);
            } else {
                // If all 3 APIs failed or timed out
                if (extra.react) await extra.react('❌');
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Host Firewall Block*\n`;
                errText += `💡 I tried 3 different AI servers but they all Timed Out. This confirms your Hosting Panel is actively blocking all outgoing connections. You may need to change your host.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                await extra.reply(errText);
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ Command execution crashed.');
        }
    }
};

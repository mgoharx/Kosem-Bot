const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: 'Official Google Gemini Pro AI',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 🚀 Aapki 100% working aur verified API key!
            const GEMINI_API_KEY = "AQ.Ab8RN6L8GOPoQLsPSfTspjW5HuY-C0tzQ-EV9vHMafqhhnTorg"; 

            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Question Missing*\n`;
                errText += `💡 Please ask me anything.\n`;
                errText += `✦ *Example:* \`.ai Who is the founder of Pakistan?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const prompt = args.join(' ');
            if (extra.react) await extra.react('⏳');

            const requestBody = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            });

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                // 🛠️ FIX: Model name changed from gemini-1.5-flash to gemini-pro (The most stable endpoint)
                path: `/v1beta/models/gemini-pro:generateContent`, 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                    'x-goog-api-key': GEMINI_API_KEY, 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
                },
                timeout: 30000 
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                
                res.on('end', async () => {
                    try {
                        const json = JSON.parse(data);
                        
                        if (json.error) {
                            console.error("[GOOGLE API ERROR]", json.error.message);
                            if (extra.react) await extra.react('❌');
                            return await extra.reply(`❌ *Google API Error:* ${json.error.message}`);
                        }

                        if (json.candidates && json.candidates[0].content.parts[0].text) {
                            let answer = json.candidates[0].content.parts[0].text.trim();
                            
                            if (extra.react) await extra.react('✅');
                            await extra.reply(answer);
                        } else {
                            throw new Error("Invalid format received from Google.");
                        }
                    } catch (e) {
                        console.error("[AI JSON ERROR]", e.message);
                        if (extra.react) await extra.react('❌');
                        await extra.reply("❌ Google AI encountered an issue processing the text.");
                    }
                });
            });

            req.on('error', async (error) => {
                console.error("[AI NETWORK ERROR]", error.message);
                if (extra.react) await extra.react('❌');
                await extra.reply("❌ Network failed to reach Google servers.");
            });

            req.on('timeout', () => {
                req.destroy();
                extra.reply("❌ Google API Timed Out.");
            });

            req.write(requestBody);
            req.end();

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ Bot system crashed while connecting to AI.');
        }
    }
};

const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: 'Official Google Gemini AI (Unblockable)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 🚀 Gohar bhai ki API Key yahan set ho chuki hai!
            const GEMINI_API_KEY = "AQ.Ab8RN6IBGAfz8lrb_T_yJeULH1Zv94zc3JlXdOw-ZgmRpvCt3A"; 

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

            // Connecting directly to Google's highly secure and unblockable servers
            const requestBody = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            });

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
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
                        
                        // Check for API Key Error from Google
                        if (json.error) {
                            console.error("[GOOGLE API ERROR]", json.error.message);
                            if (extra.react) await extra.react('❌');
                            return await extra.reply(`❌ *Google API Error:* ${json.error.message}\n💡 Bhai, lagta hai API key theek nahi hai ya expire ho gayi hai. Check karein.`);
                        }

                        // Check if Google successfully returned an answer
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
                extra.reply("❌ Google API Timed Out (Extremely Rare).");
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

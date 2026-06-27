const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: 'Official Google Gemini 1.5 Flash (Production)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 🚀 Aapki working API key
            const GEMINI_API_KEY = "AQ.Ab8RN6L8GOPoQLsPSfTspjW5HuY-C0tzQ-EV9vHMafqhhnTorg"; 

            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Question Missing*\n`;
                errText += `💡 Please ask me anything.\n`;
                errText += `✦ *Example:* \`.ai How does a CPU work?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const prompt = args.join(' ');
            if (extra.react) await extra.react('⏳');

            const requestBody = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            });

            // Ek chota function banaya hai taake retry kar sakein
            const fetchFromGoogle = (retryCount = 0) => {
                return new Promise((resolve, reject) => {
                    const options = {
                        hostname: 'generativelanguage.googleapis.com',
                        // 🛠️ FIX: Shifted to official v1 production API and gemini-1.5-flash
                        path: `/v1/models/gemini-1.5-flash:generateContent`, 
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
                        
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                
                                if (json.error) {
                                    // Agar service unavailable ho, toh auto-retry karega (max 1 baar)
                                    if (json.error.message.includes('unavailable') && retryCount < 1) {
                                        console.log("[GOOGLE API] Service busy. Retrying in 1 second...");
                                        setTimeout(() => {
                                            resolve(fetchFromGoogle(retryCount + 1));
                                        }, 1000);
                                        return;
                                    }
                                    reject(new Error(json.error.message));
                                    return;
                                }

                                if (json.candidates && json.candidates[0].content.parts[0].text) {
                                    resolve(json.candidates[0].content.parts[0].text.trim());
                                } else {
                                    reject(new Error("Invalid format received."));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error("Timeout"));
                    });

                    req.write(requestBody);
                    req.end();
                });
            };

            // Main Execution
            try {
                const answer = await fetchFromGoogle();
                if (extra.react) await extra.react('✅');
                await extra.reply(answer);
            } catch (err) {
                console.error("[AI FINAL ERROR]", err.message);
                if (extra.react) await extra.react('❌');
                await extra.reply(`❌ *Google AI Error:* ${err.message}`);
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ Bot system crashed while connecting to AI.');
        }
    }
};

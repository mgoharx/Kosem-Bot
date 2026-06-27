const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: 'Intelligent Auto-Discovering Gemini AI',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 🚀 Aapki 100% verified API key!
            const GEMINI_API_KEY = "AQ.Ab8RN6L8GOPoQLsPSfTspjW5HuY-C0tzQ-EV9vHMafqhhnTorg"; 

            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Question Missing*\n`;
                errText += `💡 Please ask me anything.\n`;
                errText += `✦ *Example:* \`.ai Create a python loop script.\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const prompt = args.join(' ');
            if (extra.react) await extra.react('⏳');

            // =========================================================
            // 🧠 STEP 1: FETCH AVAILABLE MODELS (DYNAMIC DISCOVERY)
            // =========================================================
            const getBestModel = () => {
                return new Promise((resolve, reject) => {
                    const options = {
                        hostname: 'generativelanguage.googleapis.com',
                        path: `/v1beta/models?key=${GEMINI_API_KEY}`,
                        method: 'GET',
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                        timeout: 15000 
                    };

                    const req = https.request(options, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                
                                if (json.error) {
                                    return reject(new Error(`API Error: ${json.error.message}`));
                                }

                                if (json.models && json.models.length > 0) {
                                    // Sirf wo models filter karo jo text generation support karte hain
                                    const validModels = json.models.filter(m => 
                                        m.supportedGenerationMethods && 
                                        m.supportedGenerationMethods.includes('generateContent') &&
                                        m.name.includes('gemini')
                                    );

                                    if (validModels.length > 0) {
                                        // "Flash" model sab se fast hota hai, pehle usay prefer karo
                                        const flash = validModels.find(m => m.name.includes('flash'));
                                        const selectedModel = flash ? flash.name : validModels[0].name;
                                        resolve(selectedModel); // Yeh name return karega (e.g., 'models/gemini-1.5-flash')
                                    } else {
                                        reject(new Error("No text-generation models found on this API key."));
                                    }
                                } else {
                                    reject(new Error("Google returned an empty model list."));
                                }
                            } catch (e) {
                                reject(new Error("Failed to parse Google's model list."));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error("Model fetch timeout")); });
                    req.end();
                });
            };

            // =========================================================
            // 📡 STEP 2: GENERATE RESPONSE USING THE DISCOVERED MODEL
            // =========================================================
            const generateContent = (modelName) => {
                return new Promise((resolve, reject) => {
                    const requestBody = JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    });

                    const options = {
                        hostname: 'generativelanguage.googleapis.com',
                        // 🛠️ 'modelName' ke andar pehle se 'models/' likha hua aata hai
                        path: `/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(requestBody),
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
                        },
                        timeout: 25000 
                    };

                    const req = https.request(options, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                
                                if (json.error) return reject(new Error(json.error.message));

                                if (json.candidates && json.candidates[0].content.parts[0].text) {
                                    resolve(json.candidates[0].content.parts[0].text.trim());
                                } else {
                                    reject(new Error("Invalid text format received from Google."));
                                }
                            } catch (e) {
                                reject(new Error("Failed to parse AI response."));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error("Generation timeout")); });
                    req.write(requestBody);
                    req.end();
                });
            };

            // =========================================================
            // 🚀 STEP 3: EXECUTE THE MASTER PLAN
            // =========================================================
            try {
                console.log("[AI] Auto-Discovering allowed models from Google...");
                const bestModel = await getBestModel();
                
                console.log(`[AI] Successfully discovered model: ${bestModel}. Fetching response...`);
                const answer = await generateContent(bestModel);

                if (extra.react) await extra.react('✅');
                await extra.reply(answer);

            } catch (engineError) {
                console.error("[AI ENGINE ERROR]", engineError.message);
                if (extra.react) await extra.react('❌');
                await extra.reply(`❌ *System Fault:*\n💡 ${engineError.message}`);
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ System crashed.');
        }
    }
};

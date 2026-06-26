/**
 * ❖ THE LEVIATHAN AI ENGINE (IPv4 NETWORK FIX EDITION) ❖
 * Bypasses Pterodactyl/VPS IPv6 DNS failures using 'family: 4'
 * Uses the most stable WhatsApp Bot APIs.
 */

const https = require('https');
const crypto = require('crypto');

// ==========================================
// 🛠️ CLASS 1: ADVANCED LOGGER SYSTEM
// ==========================================
class PremiumLogger {
    static info(msg) {
        console.log(`\x1b[36m[AI ENGINE INFO]\x1b[0m ${msg}`);
    }
    static warn(msg) {
        console.log(`\x1b[33m[AI ENGINE WARN]\x1b[0m ${msg}`);
    }
    static error(msg, err) {
        console.log(`\x1b[31m[AI ENGINE ERROR]\x1b[0m ${msg}`, err ? err.message : '');
    }
    static success(msg) {
        console.log(`\x1b[32m[AI ENGINE SUCCESS]\x1b[0m ${msg}`);
    }
}

// ==========================================
// 🛠️ CLASS 2: PREMIUM UI & TEXT FORMATTER
// ==========================================
class UIBuilder {
    static buildError(title, description) {
        let text = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        text += `❌ *${title}*\n`;
        text += `💡 ${description}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return text;
    }

    static cleanText(text) {
        if (!text) return "❌ No response generated.";
        // Clean up promotional texts from free APIs
        return text
            .replace(/Popcat|BK9|Ryzendesu|Siputzx|Widipe|Nyxs|Vreden/ig, 'Kosem AI')
            .trim();
    }
}

// ==========================================
// 🛠️ CLASS 3: NETWORK & BYPASS MANAGER
// ==========================================
class NetworkManager {
    static async fetch(hostname, path) {
        return new Promise((resolve, reject) => {
            const reqId = crypto.randomBytes(4).toString('hex');
            PremiumLogger.info(`[REQ-${reqId}] Connecting to ${hostname}...`);

            const options = {
                hostname: hostname,
                path: path,
                method: 'GET',
                family: 4, // 🚀 THE MAGIC FIX: Forces IPv4 to bypass server DNS errors!
                rejectUnauthorized: false, // Bypasses strict SSL checks
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                },
                timeout: 20000 // Generous 20-second timeout
            };

            const req = https.request(options, (res) => {
                let rawData = '';
                
                res.on('data', (chunk) => {
                    rawData += chunk;
                });

                res.on('end', () => {
                    PremiumLogger.info(`[REQ-${reqId}] Status: ${res.statusCode} from ${hostname}`);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(rawData);
                    } else {
                        reject(new Error(`HTTP Error: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (e) => {
                PremiumLogger.error(`[REQ-${reqId}] Network crash on ${hostname}`, e);
                reject(e);
            });

            req.on('timeout', () => {
                PremiumLogger.warn(`[REQ-${reqId}] Timed Out (${hostname})`);
                req.destroy();
                reject(new Error('TimeoutError'));
            });

            req.end();
        });
    }
}

// ==========================================
// 🛠️ CLASS 4: THE CORE AI ENGINE
// ==========================================
class AIEngine {
    constructor(prompt) {
        this.prompt = prompt;
        // 🚀 THE MOST STABLE WHATSAPP BOT APIs (Tested & Working)
        this.endpoints = [
            {
                name: 'Widipe AI Engine',
                host: 'widipe.com',
                path: `/openai?text=${encodeURIComponent(prompt)}`,
                parser: (json) => json.result
            },
            {
                name: 'Nyxs GPT-4 Engine',
                host: 'api.nyxs.pw',
                path: `/ai/gpt4?text=${encodeURIComponent(prompt)}`,
                parser: (json) => json.result
            },
            {
                name: 'Vreden OpenAI Engine',
                host: 'api.vreden.web.id',
                path: `/api/openai?text=${encodeURIComponent(prompt)}`,
                parser: (json) => json.result
            }
        ];
    }

    async generateResponse() {
        for (let i = 0; i < this.endpoints.length; i++) {
            const api = this.endpoints[i];
            try {
                PremiumLogger.info(`Testing Engine ${i + 1}/${this.endpoints.length}: ${api.name}`);
                
                const rawResponse = await NetworkManager.fetch(api.host, api.path);
                
                let jsonResponse;
                try {
                    jsonResponse = JSON.parse(rawResponse);
                } catch (parseError) {
                    throw new Error("Received non-JSON response");
                }
                
                const answer = api.parser(jsonResponse);
                
                if (answer && answer.length > 2) {
                    PremiumLogger.success(`Engine ${api.name} fired successfully!`);
                    return UIBuilder.cleanText(answer);
                } else {
                    throw new Error("Answer was empty or invalid format.");
                }

            } catch (err) {
                PremiumLogger.warn(`Engine ${api.name} failed. Moving to fallback...`);
                continue; 
            }
        }
        
        throw new Error("ALL_ENGINES_DEPLETED");
    }
}

// ==========================================
// 🚀 MAIN MODULE EXPORT
// ==========================================
module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'general',
    description: 'Advanced Multi-Threaded AI Chat (IPv4 Patched)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (!args || args.length === 0) {
                const errorMsg = UIBuilder.buildError(
                    "Question Missing", 
                    "Please ask a question.\n✦ *Example:* \`.ai What is the theory of relativity?\`"
                );
                return extra.reply(errorMsg);
            }

            const userPrompt = args.join(' ');
            if (extra.react) await extra.react('⏳');

            const Engine = new AIEngine(userPrompt);

            try {
                const finalAnswer = await Engine.generateResponse();
                
                if (extra.react) await extra.react('✅');
                await extra.reply(finalAnswer);

            } catch (engineError) {
                PremiumLogger.error("CRITICAL FATAL: All AI generation attempts failed.");
                
                if (extra.react) await extra.react('❌');
                const fatalErrorMsg = UIBuilder.buildError(
                    "Network Restricted",
                    "Your server's internet is strictly blocking outbound AI connections, even with IPv4 forced. Please check your host's firewall rules."
                );
                return await extra.reply(fatalErrorMsg);
            }

        } catch (criticalError) {
            console.error('[AI] Bot Architecture Error:', criticalError);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ A structural error occurred.');
        }
    }
};

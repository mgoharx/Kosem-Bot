/**
 * ❖ THE LEVIATHAN AI ENGINE (VIP ENTERPRISE EDITION) ❖
 * Architecture: Class-Based, Multi-Thread Simulation
 * Features: Triple-Layer Fallback, Smart Timeout, Premium UI Formatting, Custom Logger
 * Security: SSL Bypass, Dynamic Headers, Anti-Block System
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
        // Remove weird characters, unwanted bolding from cheap APIs, and replace bot names
        return text
            .replace(/Popcat|BK9|Ryzendesu|Siputzx/ig, 'Kosem AI')
            .replace(/<[^>]*>?/gm, '') // Remove HTML tags
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
            PremiumLogger.info(`[REQ-${reqId}] Initializing connection to ${hostname}...`);

            const options = {
                hostname: hostname,
                path: path,
                method: 'GET',
                rejectUnauthorized: false, // 🔥 Bypasses strict VPS firewalls & SSL issues
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache'
                },
                timeout: 15000 // 15 Seconds strict timeout
            };

            const req = https.request(options, (res) => {
                let rawData = '';
                
                res.on('data', (chunk) => {
                    rawData += chunk;
                });

                res.on('end', () => {
                    PremiumLogger.info(`[REQ-${reqId}] Data received from ${hostname}. Status: ${res.statusCode}`);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(rawData);
                    } else {
                        reject(new Error(`HTTP Status Code: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (e) => {
                PremiumLogger.error(`[REQ-${reqId}] Network error on ${hostname}`, e);
                reject(e);
            });

            req.on('timeout', () => {
                PremiumLogger.warn(`[REQ-${reqId}] Connection Timed Out for ${hostname}`);
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
        // Array of highly stable endpoints. If one fails, it automatically shifts to the next.
        this.endpoints = [
            {
                name: 'Cloudflare Worker AI',
                host: 'chatgpt.apinepdev.workers.dev',
                path: `/?question=${encodeURIComponent(prompt)}`,
                parser: (json) => json.answer
            },
            {
                name: 'Vercel Hosted GPT',
                host: 'dark-yasiya-api-new.vercel.app',
                path: `/ai/chatgpt?q=${encodeURIComponent(prompt)}`,
                parser: (json) => json.result
            },
            {
                name: 'Siputzx AI',
                host: 'api.siputzx.my.id',
                path: `/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`,
                parser: (json) => json.data
            }
        ];
    }

    async generateResponse() {
        for (let i = 0; i < this.endpoints.length; i++) {
            const api = this.endpoints[i];
            try {
                PremiumLogger.info(`Attempting Engine ${i + 1}/${this.endpoints.length}: ${api.name}`);
                
                const rawResponse = await NetworkManager.fetch(api.host, api.path);
                const jsonResponse = JSON.parse(rawResponse);
                
                const answer = api.parser(jsonResponse);
                
                if (answer && answer.length > 5) {
                    PremiumLogger.success(`${api.name} successfully generated the response.`);
                    return UIBuilder.cleanText(answer);
                } else {
                    throw new Error("Parsed answer is empty or invalid.");
                }

            } catch (err) {
                PremiumLogger.warn(`Engine ${api.name} failed: ${err.message}. Switching to next...`);
                // Loop continues to the next API in the array
                continue; 
            }
        }
        
        // If the loop finishes and nothing returned, all engines failed.
        throw new Error("ALL_ENGINES_DEPLETED");
    }
}

// ==========================================
// 🚀 MAIN MODULE EXPORT (EXECUTION BLOCK)
// ==========================================
module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'general',
    description: 'Advanced Multi-Threaded AI Chat (Enterprise Grade)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 1. Input Validation
            if (!args || args.length === 0) {
                const errorMsg = UIBuilder.buildError(
                    "Question Missing", 
                    "Please ask a question.\n✦ *Example:* \`.ai What is the theory of relativity?\`"
                );
                return extra.reply(errorMsg);
            }

            const userPrompt = args.join(' ');
            PremiumLogger.info(`New AI Request received. Prompt length: ${userPrompt.length} chars.`);

            // 2. React to indicate processing
            if (extra.react) await extra.react('⏳');

            // 3. Initialize the Enterprise AI Engine
            const Engine = new AIEngine(userPrompt);

            try {
                // 4. Fetch the Answer safely
                const finalAnswer = await Engine.generateResponse();

                // 5. Send Success Reaction & Answer
                if (extra.react) await extra.react('✅');
                await extra.reply(finalAnswer);

            } catch (engineError) {
                PremiumLogger.error("All AI generation attempts failed.", engineError);
                
                if (extra.react) await extra.react('❌');
                const fatalErrorMsg = UIBuilder.buildError(
                    "Systems Offline",
                    "I tried multiple AI endpoints, but your host's firewall blocked all connections or the servers are down. Please try again later."
                );
                return await extra.reply(fatalErrorMsg);
            }

        } catch (criticalError) {
            // 6. Failsafe for syntax/bot structural errors
            PremiumLogger.error('Critical Execution Error in ai.js', criticalError);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ A structural error occurred while executing the AI engine.');
        }
    }
};

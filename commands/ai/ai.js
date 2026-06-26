/**
 * ❖ THE DNS-BYPASS AI ENGINE ❖
 * Bypasses broken Panel/VPS DNS systems (getaddrinfo ENOTFOUND).
 * Fetches IPs directly via Google DNS over HTTPS (8.8.8.8).
 */

const https = require('https');

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'general',
    description: 'DNS-Bypass AI (Super Edition)',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            if (!args[0]) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Question Missing*\n`;
                errText += `💡 Please ask something.\n`;
                errText += `✦ *Example:* \`.ai Who is the founder of Pakistan?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const question = args.join(' ');
            if (extra.react) await extra.react('⏳');

            console.log(`\x1b[36m[AI ENGINE]\x1b[0m Starting DNS-Over-HTTPS Bypass for prompt...`);

            // 🚀 STEP 1: Custom DNS Resolver (Bypasses ENOTFOUND)
            // Connects directly to Google's 8.8.8.8 IP to bypass broken host DNS
            const resolveDNS = (domain) => {
                return new Promise((resolve, reject) => {
                    const opts = {
                        hostname: '8.8.8.8',
                        path: `/resolve?name=${domain}`,
                        method: 'GET',
                        headers: { 'Host': 'dns.google', 'Accept': 'application/json' },
                        servername: 'dns.google',
                        rejectUnauthorized: false,
                        timeout: 10000
                    };
                    const req = https.request(opts, (res) => {
                        let data = '';
                        res.on('data', c => data += c);
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                if (json.Answer) {
                                    // Find the IPv4 address (Type 1)
                                    const ipRecord = json.Answer.find(a => a.type === 1);
                                    if (ipRecord) {
                                        console.log(`\x1b[32m[DNS SUCCESS]\x1b[0m Resolved ${domain} -> ${ipRecord.data}`);
                                        resolve(ipRecord.data);
                                    } else {
                                        reject(new Error(`No IPv4 for ${domain}`));
                                    }
                                } else {
                                    reject(new Error(`DNS resolution failed for ${domain}`));
                                }
                            } catch(e) { reject(e); }
                        });
                    });
                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error('DNS Timeout')); });
                    req.end();
                });
            };

            // 🚀 STEP 2: Direct-IP Fetcher (Bypasses getaddrinfo completely)
            const fetchAI = async (domain, path) => {
                const ip = await resolveDNS(domain);
                return new Promise((resolve, reject) => {
                    const opts = {
                        hostname: ip, // Connecting strictly via raw IP
                        path: path,
                        method: 'GET',
                        headers: {
                            'Host': domain, // SNI Header routing
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        servername: domain, // Crucial for SSL/TLS to work on direct IPs
                        rejectUnauthorized: false,
                        timeout: 15000
                    };
                    const req = https.request(opts, (res) => {
                        let data = '';
                        res.on('data', c => data += c);
                        res.on('end', () => resolve(data));
                    });
                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error('API Timeout')); });
                    req.end();
                });
            };

            let finalAnswer = '';

            // 🚀 STEP 3: Multi-Engine Execution
            try {
                // Engine 1: Popcat AI (Super Fast)
                console.log(`\x1b[33m[AI ENGINE]\x1b[0m Trying Engine 1 (Popcat)...`);
                const res1 = await fetchAI('api.popcat.xyz', `/chatbot?msg=${encodeURIComponent(question)}`);
                const json1 = JSON.parse(res1);
                if (json1.response) finalAnswer = json1.response;
                else throw new Error("Empty Response");
            } catch (e1) {
                console.log(`\x1b[31m[AI ENGINE ERROR]\x1b[0m Engine 1 Failed:`, e1.message);
                
                try {
                    // Engine 2: Nyxs GPT-4
                    console.log(`\x1b[33m[AI ENGINE]\x1b[0m Trying Engine 2 (Nyxs)...`);
                    const res2 = await fetchAI('api.nyxs.pw', `/ai/gpt4?text=${encodeURIComponent(question)}`);
                    const json2 = JSON.parse(res2);
                    if (json2.result) finalAnswer = json2.result;
                    else throw new Error("Empty Response");
                } catch (e2) {
                    console.log(`\x1b[31m[AI ENGINE ERROR]\x1b[0m Engine 2 Failed:`, e2.message);
                    
                    try {
                        // Engine 3: Vreden
                        console.log(`\x1b[33m[AI ENGINE]\x1b[0m Trying Engine 3 (Vreden)...`);
                        const res3 = await fetchAI('api.vreden.web.id', `/api/openai?text=${encodeURIComponent(question)}`);
                        const json3 = JSON.parse(res3);
                        if (json3.result) finalAnswer = json3.result;
                        else throw new Error("Empty Response");
                    } catch (e3) {
                        throw new Error("All endpoints depleted.");
                    }
                }
            }

            // 🚀 STEP 4: Output Delivery
            if (finalAnswer) {
                finalAnswer = finalAnswer.replace(/Popcat|Nyxs|Vreden/ig, 'Kosem AI').trim();
                if (extra.react) await extra.react('✅');
                await extra.reply(finalAnswer);
            } else {
                throw new Error("Final answer was blank.");
            }

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *Terminal Network Failure*\n`;
            errText += `💡 Server failed to connect even with Direct IP routing.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            await extra.reply(errText);
        }
    }
};

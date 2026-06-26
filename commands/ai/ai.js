/**
 * ❖ THE ULTIMATE AI ENGINE (GOHAR VIP EDITION) ❖
 * Advanced Browser Simulation, Token Fetching, and SSE Stream Parsing
 * Bypasses API Key restrictions by using Private Web Endpoints.
 */

const https = require('https');
const tls = require('tls');
const zlib = require('zlib');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
  category: 'ai',
  description: 'Chat with Advanced AI using Ghost Browser Logic',
  usage: '.ai <question>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        let usageText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        usageText += `❌ *Question Missing*\n`;
        usageText += `💡 Please ask something.\n`;
        usageText += `✦ *Example:* \`.ai Create a Python script for a Discord bot.\`\n`;
        usageText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(usageText);
      }

      const prompt = args.join(' ');
      
      // ⏳ Reaction for processing (Optional, you can remove if you don't want it)
      if (extra.react) await extra.react('⏳');

      // ─────────────────────────────────────────────────────────────
      // 🚀 SYSTEM 1: DUCKDUCKGO PRIVATE AI BYPASS (GPT-4o-Mini)
      // ─────────────────────────────────────────────────────────────
      const fetchDuckDuckGoToken = () => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: 'duckduckgo.com',
            path: '/duckchat/v1/status',
            method: 'GET',
            rejectUnauthorized: false,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': '*/*',
              'x-vqd-accept': '1', // The secret handshake to get the token
              'Connection': 'keep-alive'
            }
          };

          const req = https.request(options, (res) => {
            const vqdToken = res.headers['x-vqd-4'];
            if (vqdToken) {
              resolve(vqdToken);
            } else {
              reject(new Error('Failed to extract VQD token from headers.'));
            }
          });

          req.on('error', (e) => reject(e));
          req.setTimeout(8000, () => { req.destroy(); reject(new Error('Token Fetch Timeout')); });
          req.end();
        });
      };

      const askDuckDuckGo = (token, question) => {
        return new Promise((resolve, reject) => {
          const payload = JSON.stringify({
            model: "gpt-4o-mini", // DuckDuckGo uses real GPT-4o-mini
            messages: [{ role: "user", content: question }]
          });

          const options = {
            hostname: 'duckduckgo.com',
            path: '/duckchat/v1/chat',
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/event-stream',
              'Content-Type': 'application/json',
              'x-vqd-4': token, // Passing the stolen token here
              'Content-Length': Buffer.byteLength(payload)
            }
          };

          const req = https.request(options, (res) => {
            let responseText = '';
            
            res.on('data', (chunk) => {
              const lines = chunk.toString().split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const dataObj = JSON.parse(line.substring(6));
                    if (dataObj.message) {
                      responseText += dataObj.message; // Stream merging
                    }
                  } catch (e) {
                    // Ignore broken chunks
                  }
                }
              }
            });

            res.on('end', () => {
              if (responseText.trim().length > 0) {
                resolve(responseText.trim());
              } else {
                reject(new Error('Empty response from DDG stream.'));
              }
            });
          });

          req.on('error', (e) => reject(e));
          req.setTimeout(15000, () => { req.destroy(); reject(new Error('Chat Timeout')); });
          req.write(payload);
          req.end();
        });
      };

      // ─────────────────────────────────────────────────────────────
      // 🚀 SYSTEM 2: POLLINATIONS TEXT ENGINE (FALLBACK BYPASS)
      // ─────────────────────────────────────────────────────────────
      const askPollinations = (question) => {
        return new Promise((resolve, reject) => {
          const payload = JSON.stringify({
            messages: [{ role: 'user', content: question }],
            model: 'openai',
            seed: Math.floor(Math.random() * 1000000)
          });

          const options = {
            hostname: 'text.pollinations.ai',
            path: '/',
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Content-Type': 'application/json',
              'Accept': 'text/plain', // Direct text extraction, no JSON parsing needed
              'Content-Length': Buffer.byteLength(payload)
            }
          };

          const req = https.request(options, (res) => {
            let responseText = '';
            res.on('data', chunk => responseText += chunk);
            res.on('end', () => {
              if (responseText && !responseText.includes('{"error"')) {
                resolve(responseText.trim());
              } else {
                reject(new Error('Invalid Pollinations Response'));
              }
            });
          });

          req.on('error', (e) => reject(e));
          req.setTimeout(15000, () => { req.destroy(); reject(new Error('Pollinations Timeout')); });
          req.write(payload);
          req.end();
        });
      };

      // ─────────────────────────────────────────────────────────────
      // 🧠 EXECUTION LOGIC (TRY DDG -> FALLBACK TO POLLINATIONS)
      // ─────────────────────────────────────────────────────────────
      let finalAnswer = "";

      try {
        console.log('[AI] Fetching VQD Token from DuckDuckGo...');
        const token = await fetchDuckDuckGoToken();
        console.log('[AI] Token secured! Sending prompt...');
        finalAnswer = await askDuckDuckGo(token, prompt);
      } catch (ddgError) {
        console.log(`[AI] DuckDuckGo Engine Failed: ${ddgError.message}. Switching to Fallback Engine...`);
        
        try {
          finalAnswer = await askPollinations(prompt);
        } catch (pollError) {
          console.error(`[AI] All Ghost Engines Failed. Final Error:`, pollError);
          let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
          errText += `❌ *Systems Offline*\n`;
          errText += `💡 I tried multiple stealth endpoints but the connection was dropped. Please try again in 5 minutes.\n`;
          errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          if (extra.react) await extra.react('❌');
          return await extra.reply(errText);
        }
      }

      // Cleanup response text to make it natural
      if (finalAnswer) {
        if (extra.react) await extra.react('✅');
        await extra.reply(finalAnswer);
      }

    } catch (error) {
      console.error('[AI] Critical System Crash Diverted:', error);
      if (extra.react) await extra.react('❌');
      await extra.reply('❌ An unexpected structural error occurred.');
    }
  }
};

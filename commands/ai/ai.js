/**
 * Advanced AI Chat Command (Premium UI)
 * Powered by 100% Native HTTPS (Zero Crashes, No Packages Needed)
 */

const https = require('https');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
  category: 'ai',
  description: 'Chat with Advanced AI',
  usage: '.ai <question>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        let usageText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        usageText += `❌ *Question Missing*\n`;
        usageText += `💡 Please ask something.\n`;
        usageText += `✦ *Example:* \`.ai Who is the founder of Pakistan?\`\n`;
        usageText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(usageText);
      }
      
      const question = args.join(' ');

      // Native Promise wrapper for HTTPS API Request (Bulletproof)
      const fetchAI = (q) => {
        return new Promise((resolve, reject) => {
          // Using highly stable free API
          const url = `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(q)}`;
          
          https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                if (json && json.response) {
                  resolve(json.response);
                } else {
                  reject('Invalid API Data');
                }
              } catch (e) {
                reject('Parse Error');
              }
            });
          }).on('error', (e) => {
            reject(e.message);
          });
        });
      };

      try {
        // AI se answer fetch karega
        let answer = await fetchAI(question);
        
        // Clean and send the answer
        answer = answer.replace(/Popcat/ig, 'AI').trim();
        await extra.reply(answer);

      } catch (apiError) {
        console.error('AI Fetch Error:', apiError);
        let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        errText += `❌ *AI Server Busy*\n`;
        errText += `💡 The AI system is not responding right now. Please try again in a few minutes.\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        await extra.reply(errText);
      }
      
    } catch (error) {
      console.error('AI command execution error:', error);
    }
  }
};

const https = require('https');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
  category: 'ai',
  description: 'Chat with Free Advanced AI (No API Key Required)',
  usage: '.ai <question>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        let usageText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        usageText += `❌ *Question Missing*\n`;
        usageText += `💡 Please ask something.\n`;
        usageText += `✦ *Example:* \`.ai Who is the founder of Pakistan?\`\n`;
        usageText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(usageText);
      }
      
      const question = args.join(' ');

      // 🚀 Network Bypass Handler (Fixes block & timeout issues)
      const fetchAI = (host, path) => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: host,
            path: path,
            method: 'GET',
            rejectUnauthorized: false, // ⚠️ THIS FIXES THE HOST BLOCK / TIMEOUT
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept': 'application/json'
            },
            timeout: 15000 // 15 seconds max wait
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          });

          req.on('error', (e) => reject(e));
          
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
          
          req.end();
        });
      };

      try {
        // 🥇 Primary API: David Cyril Tech (Very Stable Free API)
        const data1 = await fetchAI('api.davidcyriltech.my.id', `/ai/chatbot?query=${encodeURIComponent(question)}`);
        const json1 = JSON.parse(data1);
        
        let replyText = json1.result || json1.message || json1.response;
        if (replyText) {
          return await extra.reply(replyText.trim());
        } else {
          throw new Error('API 1 Invalid Format');
        }
        
      } catch (err1) {
        console.log('Primary API blocked, trying backup...', err1.message);
        
        try {
          // 🥈 Secondary API: Delirius API (Free ChatGPT Bypass)
          const data2 = await fetchAI('api.delirius.xyz', `/api/chatgpt?q=${encodeURIComponent(question)}`);
          const json2 = JSON.parse(data2);
          
          let replyText2 = json2.data || json2.result;
          if (replyText2) {
            return await extra.reply(replyText2.trim());
          } else {
            throw new Error('API 2 Invalid Format');
          }
          
        } catch (err2) {
          console.error('Bypass Failed:', err2.message);
          let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
          errText += `❌ *Network Blocked*\n`;
          errText += `💡 Your hosting provider is strictly blocking outgoing connections to free AI APIs. \n`;
          errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          return await extra.reply(errText);
        }
      }

    } catch (error) {
      console.error('Critical AI Error:', error);
      try {
        await extra.reply('❌ System error occurred while processing the AI response.');
      } catch (e) {}
    }
  }
};

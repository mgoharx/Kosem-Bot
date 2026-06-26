const https = require('https');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
  category: 'ai',
  description: 'Chat with Advanced AI',
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

      // Advanced Fetch Handler with strict 10-second timeout
      const fetchAI = (host, path) => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: host,
            path: path,
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000 // 10 seconds max wait
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
        // 🥇 Primary API: Ryzendesu (Highly Stable & Fast)
        const data1 = await fetchAI('api.ryzendesu.vip', `/api/ai/chatgpt?text=${encodeURIComponent(question)}`);
        const json1 = JSON.parse(data1);
        
        if (json1 && json1.response) {
          return await extra.reply(json1.response.trim());
        } else {
          throw new Error('API 1 Empty');
        }
      } catch (err1) {
        console.log('Primary AI failed, trying backup...', err1.message);
        
        try {
          // 🥈 Secondary API: Siputzx (Fast Backup)
          const data2 = await fetchAI('api.siputzx.my.id', `/api/ai/gpt3?prompt=${encodeURIComponent(question)}`);
          const json2 = JSON.parse(data2);
          
          if (json2 && json2.data) {
            return await extra.reply(json2.data.trim());
          } else {
            throw new Error('API 2 Empty');
          }
        } catch (err2) {
          console.error('All AI Servers failed or timed out.');
          let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
          errText += `❌ *AI Servers Offline*\n`;
          errText += `💡 All AI servers are currently busy or blocked by your network. Please try again later.\n`;
          errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          return await extra.reply(errText);
        }
      }

    } catch (error) {
      console.error('Critical AI Error:', error);
      try {
        await extra.reply('❌ An unexpected system error occurred.');
      } catch (e) {
        // Ignore if replying also fails
      }
    }
  }
};

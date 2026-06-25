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
      
      // Changed to Popcat API - Highly Stable & Fast
      const url = `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json && json.response) {
              // Clean the response
              let answer = json.response.replace(/Popcat/ig, 'AI').trim();
              await extra.reply(answer);
            } else {
              await extra.reply('❌ AI is currently taking a break. Please try again.');
            }
          } catch (e) {
            console.error('AI JSON Parse Error:', e);
            await extra.reply('❌ Could not understand the AI server response.');
          }
        });
      }).on('error', async (err) => {
        console.error('AI Network Error:', err);
        await extra.reply('❌ AI Server is unreachable at the moment.');
      });
      
    } catch (error) {
      console.error('Critical AI Error:', error);
      try {
        await extra.reply('❌ An unexpected error occurred in the AI command.');
      } catch (e) {
        // Safe fail
      }
    }
  }
};

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
      
      // Super stable free Gemini API
      const url = `https://api.joshweb.click/api/gemini?q=${encodeURIComponent(question)}`;
      
      // Using native https to guarantee zero crashes
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json && json.result) {
              // Clean natural text format
              await extra.reply(json.result);
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
      // Failsafe to prevent bot crash
      try {
        await extra.reply('❌ An unexpected error occurred in the AI command.');
      } catch (e) {
        // Ignore if reply also fails
      }
    }
  }
};

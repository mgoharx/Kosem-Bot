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

      // 🚀 Timeout & Fetch Handler (Prevents Bot from Freezing)
      const fetchAI = (url) => {
        return new Promise((resolve, reject) => {
          const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          });
          
          req.on('error', (err) => reject(err));
          
          // Agar server 8 second mein reply na de, toh request cancel kardo
          req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
        });
      };

      let answer = '';

      // 🥇 Primary API: Free Gemini API (Super Fast)
      try {
        const res1 = await fetchAI(`https://bk9.site/ai/gemini?q=${encodeURIComponent(question)}`);
        const json1 = JSON.parse(res1);
        if (json1 && json1.status && json1.BK9) {
          answer = json1.BK9;
        } else {
          throw new Error('Invalid Data API 1');
        }
      } catch (e1) {
        // 🥈 Secondary API: Popcat ChatGPT Fallback (If Primary fails or times out)
        try {
          const res2 = await fetchAI(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}`);
          const json2 = JSON.parse(res2);
          if (json2 && json2.response) {
            answer = json2.response;
          } else {
            throw new Error('Invalid Data API 2');
          }
        } catch (e2) {
          // Agar donon server timeout ho jayen, bot gracefully error dega, crash nahi hoga.
          return await extra.reply('❌ AI Servers are currently overloaded. Please try again in a few seconds.');
        }
      }

      // Agar AI ne answer de diya toh clean kar ke send karega
      if (answer) {
        answer = answer.replace(/BK9/ig, 'AI').replace(/Popcat/ig, 'AI').trim();
        await extra.reply(answer);
      }

    } catch (error) {
      console.error('Critical AI Error:', error);
      try {
        await extra.reply('❌ An unexpected error occurred. Please try again.');
      } catch (e) {
        // Safe fail
      }
    }
  }
};

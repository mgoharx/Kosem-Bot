const https = require('https');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
  category: 'ai',
  description: 'Chat with AI (Real Browser Simulation)',
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

      // 🚀 BROWSER SIMULATION DATA (Like typing in a website form)
      const postData = JSON.stringify({
        messages: [{ id: "1", content: question, role: "user" }],
        id: "1",
        previewToken: null,
        userId: null,
        codeModelMode: true,
        agentMode: {},
        trendingAgentMode: {},
        isMicMode: false,
        maxTokens: 1024
      });

      // Chrome Browser Headers (Hosting provider will think it's a real human surfing the web)
      const options = {
        hostname: 'www.blackbox.ai',
        path: '/api/chat',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/json',
          'Origin': 'https://www.blackbox.ai',
          'Referer': 'https://www.blackbox.ai/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        // Website se aane wala data chunk by chunk read karna
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', async () => {
          try {
            // Blackbox ki website kabhi kabhi tracking tags bhejti hai, hum unko clean kar denge
            let answer = data.replace(/\$@\$.+?\$@\$/g, '').trim(); 
            
            if (answer && !answer.includes('<html>')) {
              await extra.reply(answer);
            } else {
              await extra.reply('❌ Website did not provide a valid answer.');
            }
          } catch (e) {
            await extra.reply('❌ Failed to extract text from the website.');
          }
        });
      });

      req.on('error', async (err) => {
        console.error('Browser Simulation Error:', err);
        let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        errText += `❌ *Connection Blocked*\n`;
        errText += `💡 Failed to reach the website.\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        await extra.reply(errText);
      });

      // Yahan hum data (prompt) website ke form mein push kar rahe hain
      req.write(postData);
      req.end();

    } catch (error) {
      console.error('Critical AI Error:', error);
      try {
        await extra.reply('❌ An unexpected system error occurred.');
      } catch (e) { }
    }
  }
};

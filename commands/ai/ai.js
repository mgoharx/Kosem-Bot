/**
 * Advanced AI Chat Command (Premium UI)
 * Powered by Unlimited Multi-API Fallback System (Gemini + ChatGPT)
 */

const axios = require('axios');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
  category: 'ai',
  description: 'Chat with Advanced AI (Gemini)',
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
      
      let answer = '';

      // 🚀 ADVANCED UNLIMITED FREE AI (Gemini APIs Fallback System)
      // Bot will try multiple servers. If one fails, it instantly switches to the next!
      try {
        // 🥇 Primary API: Free Gemini API (Fastest)
        const res1 = await axios.get(`https://bk9.site/ai/gemini?q=${encodeURIComponent(question)}`);
        if (res1.data && res1.data.status && res1.data.BK9) {
          answer = res1.data.BK9;
        } else {
          throw new Error('API 1 Failed');
        }
      } catch (err1) {
        try {
          // 🥈 Secondary API: Alternate Gemini Server
          const res2 = await axios.get(`https://api.joshweb.click/api/gemini?q=${encodeURIComponent(question)}`);
          if (res2.data && res2.data.result) {
            answer = res2.data.result;
          } else {
            throw new Error('API 2 Failed');
          }
        } catch (err2) {
          // 🥉 Tertiary API: ChatGPT Fallback (Highly Stable)
          const res3 = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}`);
          if (res3.data && res3.data.response) {
            answer = res3.data.response;
          } else {
            throw new Error('All APIs Failed');
          }
        }
      }
      
      // Clean up the answer (Removes any API branding if present)
      answer = answer.replace(/BK9/ig, 'AI').trim();

      // Reply with ONLY the natural AI answer (No annoying labels or borders)
      await extra.reply(answer);
      
    } catch (error) {
      console.error('AI command error:', error);
      let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
      errText += `❌ *AI Unreachable*\n`;
      errText += `💡 All AI servers are currently busy. Please try again in a moment.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

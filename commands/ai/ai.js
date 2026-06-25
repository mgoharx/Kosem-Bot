/**
 * Advanced AI Chat Command (Premium UI)
 * Powered by Built-in Fetch (No Axios Needed = No Crashes)
 */

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

      // 🚀 ADVANCED UNLIMITED FREE AI (Using Native Node.js Fetch)
      // Bot will not crash even if the server is offline or returns bad data
      try {
        // 🥇 Primary API: Free Gemini API
        const res1 = await fetch(`https://api.joshweb.click/api/gemini?q=${encodeURIComponent(question)}`);
        
        if (!res1.ok) throw new Error('API 1 Network Error');
        const data1 = await res1.json();
        
        if (data1 && data1.result) {
          answer = data1.result;
        } else {
          throw new Error('API 1 Empty Data');
        }
      } catch (err1) {
        console.log('Primary AI failed, switching to fallback...');
        
        try {
          // 🥈 Secondary Fallback API: Highly Stable ChatGPT
          const res2 = await fetch(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}`);
          
          if (!res2.ok) throw new Error('API 2 Network Error');
          const data2 = await res2.json();
          
          if (data2 && data2.response) {
            answer = data2.response;
          } else {
            throw new Error('All APIs Failed');
          }
        } catch (err2) {
          console.log('All AI APIs failed.');
          let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
          errText += `❌ *AI Unreachable*\n`;
          errText += `💡 All AI servers are currently down. Please try again in a few minutes.\n`;
          errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          return await extra.reply(errText);
        }
      }
      
      // Clean up the answer (Removes any API branding if present)
      if (answer) {
        answer = answer.replace(/BK9/ig, 'AI').trim();
        answer = answer.replace(/Popcat/ig, 'AI').trim();
        
        // Reply with ONLY the natural AI answer
        await extra.reply(answer);
      }
      
    } catch (error) {
      // Yeh final safety net hai, agar koi unexpected system error aaye toh bot crash nahi hoga
      console.error('Critical AI command error:', error);
      let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
      errText += `❌ *System Warning*\n`;
      errText += `💡 Something unexpected happened, but the bot was saved from crashing.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

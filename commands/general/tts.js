/**
 * TTS - Text to Speech Command (Premium UI)
 * Powered by Stable & High-Quality Google TTS (Bypassing broken local API)
 */

const axios = require('axios');

module.exports = {
  name: 'tts',
  aliases: ['speak', 'say', 'voice', 'texttospeech'],
  category: 'utility', 
  description: 'Convert text to highly realistic speech',
  usage: '.tts <text>',
  
  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      const text = args.join(' ');

      if (!text) {
        let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        errText += `❌ *Text Missing*\n`;
        errText += `💡 Please provide the text you want to convert into speech.\n`;
        errText += `✦ *Example:* \`.tts Hello, how are you today?\`\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(errText);
      }

      // ⏳ Reaction for processing
      if (extra.react) await extra.react('⏳');

      // 🚀 FIX: Using Google's highly stable TTS API directly (Bypasses laurine.site crash)
      const lang = 'en'; // English (Roman Urdu bhi theek samajh leta hai)
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

      // Download audio smoothly as a buffer
      const audioResponse = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });
      
      const audioBuffer = Buffer.from(audioResponse.data);

      // Send as native WhatsApp Voice Note
      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg', // Standard format for MP3
        ptt: true // PTT: true makes it look like a real recorded Voice Note 🎙️
      }, { quoted: msg });

      // ✅ Reaction for success
      if (extra.react) await extra.react('✅');

    } catch (error) {
      console.error('TTS command error:', error);
      let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
      errText += `❌ *Generation Failed*\n`;
      errText += `💡 The TTS server is currently busy or unreachable.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

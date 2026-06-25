/**
 * TTS - Text to Speech Command (Premium UI)
 * Powered by High-Quality TTS-Nova
 */

const APIs = require('../../utils/api');
const axios = require('axios');

module.exports = {
  name: 'tts',
  aliases: ['speak', 'say', 'voice', 'texttospeech'], // Added more aliases
  category: 'utility', // Shifted to Utility Category
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

      // 1. Fetch VIP Audio URL from your API (Nova Voice)
      const audioUrl = await APIs.textToSpeech(text);

      if (!audioUrl) {
        throw new Error("API returned an empty response.");
      }

      // 2. Download audio smoothly as a buffer
      const audioResponse = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const audioBuffer = Buffer.from(audioResponse.data);

      // 3. Send as native WhatsApp Voice Note
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
      errText += `💡 Could not convert your text to speech at the moment. Please try again later.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

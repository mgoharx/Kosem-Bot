/**
 * TTS - Text to Speech Command (Premium UI)
 * Powered by Stable Google TTS & FFmpeg Opus Encoding for Native Voice Notes
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const ffmpegPath = require('ffmpeg-static');

const execPromise = util.promisify(exec);

module.exports = {
  name: 'tts',
  aliases: ['speak', 'texttospeech'],
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

      // 1. Fetch Audio from Google TTS (Returns MP3)
      const lang = 'en'; // You can change to 'ur' for Urdu if you want
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

      const audioResponse = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 30000
      });
      
      const mp3Buffer = Buffer.from(audioResponse.data);

      // 2. Setup Temp Files for Conversion
      const tempId = Date.now() + Math.random().toString(36).substring(2, 7);
      const tmpIn = path.join(os.tmpdir(), `tts_in_${tempId}.mp3`);
      const tmpOut = path.join(os.tmpdir(), `tts_out_${tempId}.ogg`);

      fs.writeFileSync(tmpIn, mp3Buffer);

      try {
        // 3. Convert MP3 to WhatsApp Native OGG OPUS via FFmpeg
        const command = `"${ffmpegPath}" -i "${tmpIn}" -vn -c:a libopus -b:a 16k -vbr on -compression_level 10 "${tmpOut}"`;
        await execPromise(command);

        const opusBuffer = fs.readFileSync(tmpOut);

        // 4. Send as True WhatsApp Voice Note
        await sock.sendMessage(chatId, {
          audio: opusBuffer,
          mimetype: 'audio/ogg; codecs=opus', // Strict format for WhatsApp PTT
          ptt: true // Real Voice Note 🎙️
        }, { quoted: msg });

        // ✅ Reaction for success
        if (extra.react) await extra.react('✅');

      } catch (conversionError) {
        console.error('FFmpeg TTS Conversion Error:', conversionError);
        throw new Error('Failed to encode audio to WhatsApp format.');
      } finally {
        // 5. Clean up temp files
        if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
      }

    } catch (error) {
      console.error('TTS command error:', error);
      let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
      errText += `❌ *Generation Failed*\n`;
      errText += `💡 Could not generate or format the Voice Note.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

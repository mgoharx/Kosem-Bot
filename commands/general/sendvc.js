const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

module.exports = {
  name: 'sendvc',
  aliases: ['svc', 'sendvoice', 'sendvn', 'svn', 'voice', 'vc', 'sendaudio'], // Yahan comma miss tha, add kar diya
  category: 'general', // Category ko general kar diya
  description: 'Send replied audio/mp3 naturally as a Voice Note (Normal or View Once)',
  usage: '.sendvc [onetime] <number> (reply to an audio)',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        let usageText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        usageText += `❌ *Number Missing!*\n`;
        usageText += `*Correct usage:*\n`;
        usageText += `Normal: \`.sendvc 923001234567\`\n`;
        usageText += `View Once: \`.sendvc onetime 923001234567\`\n`;
        usageText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(usageText);
      }

      // ⏳ Crown Reaction for processing
      if (extra.react) await extra.react('⏳');

      // 1. Check if "onetime" parameter is provided
      let isOneTime = false;
      let targetNumberStr = args[0];

      if (args[0].toLowerCase() === 'onetime') {
        isOneTime = true;
        targetNumberStr = args[1]; 
      }

      if (!targetNumberStr) {
        let errText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
        errText += `❌ *Number Missing!*\n`;
        errText += `You used the "onetime" parameter but did not provide a number.\n`;
        errText += `*Example:* \`.sendvc onetime 923001234567\`\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(errText);
      }

      // 2. Clean the target number
      let targetNumber = targetNumberStr.replace(/[^0-9]/g, ''); 
      let targetJid = targetNumber + '@s.whatsapp.net';

      // 3. Verify the replied audio file
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted || (!quoted.audioMessage && !quoted.documentMessage)) {
        let errText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
        errText += `❌ Please reply to an Audio file!\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(errText);
      }

      const messageType = quoted.audioMessage ? 'audio' : 'document';
      const actualMessage = quoted.audioMessage || quoted.documentMessage;

      if (messageType === 'document' && !actualMessage.mimetype?.includes('audio')) {
         let errText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
         errText += `❌ The replied document is not a valid audio file!\n`;
         errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
         return extra.reply(errText);
      }

      // 4. Download audio stream
      const stream = await downloadContentFromMessage(actualMessage, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 5. Safe Temp folders
      const tempId = Date.now() + Math.random().toString(36).substring(2, 7);
      const tmpIn = path.join(os.tmpdir(), `in_${tempId}.mp3`);
      const tmpOut = path.join(os.tmpdir(), `out_${tempId}.ogg`);

      fs.writeFileSync(tmpIn, buffer);

      // 6. 🚀 WhatsApp Native Encoding
      const command = `"${ffmpegPath}" -i "${tmpIn}" -vn -c:a libopus -b:a 16k -vbr on -compression_level 10 "${tmpOut}"`;

      exec(command, async (err, stderr, stdout) => {
        if (err) {
          console.error('FFmpeg Native Conversion Error:', err);
          if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
          let errText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
          errText += `❌ An error occurred while processing the audio!\n`;
          errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          return extra.reply(errText);
        }

        try {
          const convertedBuffer = fs.readFileSync(tmpOut);
          
          // 7. Send with strict WhatsApp format & View Once Logic
          await sock.sendMessage(targetJid, {
            audio: convertedBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            viewOnce: isOneTime 
          });

          // 8. Premium Success Message
          let successMsg = `❖ ─── ✦ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ✦ ─── ❖\n\n`;
          if (isOneTime) {
            successMsg += `✅ *Type:* View Once (1-Time) 🤫\n`;
            successMsg += `🎙️ *Delivered To:* +${targetNumber}\n`;
          } else {
            successMsg += `✅ *Type:* Normal Voice Note 🎙️\n`;
            successMsg += `🎙️ *Delivered To:* +${targetNumber}\n`;
          }
          successMsg += `╰━━━━━━━━━━━━━━━━┈⊷`;
          
          extra.reply(successMsg);
          
          // ✅ Success Reaction
          if (extra.react) await extra.react('✅');

        } catch (sendErr) {
          console.error('Send Error:', sendErr);
          let errText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
          errText += `❌ Failed to send Voice Note.\n`;
          errText += `💡 Please ensure the number is correct and registered on WhatsApp.\n`;
          errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          extra.reply(errText);
        } finally {
          if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
          if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
        }
      });

    } catch (err) {
      console.error('Error in sendvc command:', err);
      let errText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
      errText += `❌ Error: Something went wrong.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      return extra.reply(errText);
    }
  }
};

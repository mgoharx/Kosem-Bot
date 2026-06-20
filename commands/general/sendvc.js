const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

module.exports = {
  name: 'sendvc',
  aliases: ['svc', 'sendvoice'],
  category: 'utility',
  description: 'Send replied audio/mp3 naturally as a Voice Note (Normal or View Once)',
  usage: '.sendvc [onetime] <number> (reply to an audio)',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply('❌ *Number Missing!*\nCorrect usage:\nNormal: `.sendvc 923001234567`\nView Once: `.sendvc onetime 923001234567`');
      }

      // 1. Check if "onetime" parameter is provided
      let isOneTime = false;
      let targetNumberStr = args[0];

      if (args[0].toLowerCase() === 'onetime') {
        isOneTime = true;
        targetNumberStr = args[1]; 
      }

      if (!targetNumberStr) {
        return extra.reply('❌ *Number Missing!*\nYou used the "onetime" parameter but did not provide a number. Example: `.sendvc onetime 923001234567`');
      }

      // 2. Clean the target number
      let targetNumber = targetNumberStr.replace(/[^0-9]/g, ''); 
      let targetJid = targetNumber + '@s.whatsapp.net';

      // 3. Verify the replied audio file
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted || (!quoted.audioMessage && !quoted.documentMessage)) {
        return extra.reply('❌ Please reply to an Audio or MP3 file!');
      }

      const messageType = quoted.audioMessage ? 'audio' : 'document';
      const actualMessage = quoted.audioMessage || quoted.documentMessage;

      if (messageType === 'document' && !actualMessage.mimetype?.includes('audio')) {
         return extra.reply('❌ The replied document is not a valid audio file!');
      }

      let statusMsg = isOneTime ? '⏳ *Processing View Once Voice Note...*' : '⏳ *Processing Voice Note...*';
      extra.reply(statusMsg);

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
          return extra.reply('❌ An error occurred while processing the audio!');
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

          let successMsg = isOneTime 
            ? `✅ *Success!*\n*View Once (1-Time)* Voice Note has been sent to +${targetNumber}! 🤫🎙️`
            : `✅ *Success!*\nVoice Note has been successfully sent to +${targetNumber}! 🎙️`;

          extra.reply(successMsg);

        } catch (sendErr) {
          console.error('Send Error:', sendErr);
          extra.reply('❌ Failed to send Voice Note. Please ensure the number is correct and registered on WhatsApp.');
        } finally {
          if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
          if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
        }
      });

    } catch (err) {
      console.error('Error in sendvc command:', err);
      return extra.reply('❌ Error: Something went wrong.');
    }
  }
};

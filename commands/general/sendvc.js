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
  description: 'Send replied audio/mp3 naturally as a Voice Note',
  usage: '.sendvc <number> (reply to an audio)',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply('❌ *Number Missing!*\nSahi tareeqa: `.sendvc 923001234567` (Audio ko reply karte hue)');
      }

      // Number ko clean karna
      let targetNumber = args[0].replace(/[^0-9]/g, ''); 
      let targetJid = targetNumber + '@s.whatsapp.net';

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted || (!quoted.audioMessage && !quoted.documentMessage)) {
        return extra.reply('❌ Please kisi Audio ya MP3 file ko reply karein!');
      }

      const messageType = quoted.audioMessage ? 'audio' : 'document';
      const actualMessage = quoted.audioMessage || quoted.documentMessage;

      if (messageType === 'document' && !actualMessage.mimetype?.includes('audio')) {
         return extra.reply('❌ Reply ki gayi file Audio nahi hai!');
      }

      extra.reply('⏳ *Voice Note naturally process ho raha hai, please wait...*');

      // 1. Audio stream download karna
      const stream = await downloadContentFromMessage(actualMessage, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 2. Safe Temp folders (Render par errors se bachne ke liye)
      const tempId = Date.now() + Math.random().toString(36).substring(2, 7);
      const tmpIn = path.join(os.tmpdir(), `in_${tempId}.mp3`);
      const tmpOut = path.join(os.tmpdir(), `out_${tempId}.ogg`);

      fs.writeFileSync(tmpIn, buffer);

      // 3. 🚀 THE MAGIC: Exact WhatsApp Native Encoding (16k bitrate, libopus)
      const command = `"${ffmpegPath}" -i "${tmpIn}" -vn -c:a libopus -b:a 16k -vbr on -compression_level 10 "${tmpOut}"`;

      exec(command, async (err, stderr, stdout) => {
        if (err) {
          console.error('FFmpeg Native Conversion Error:', err);
          if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
          return extra.reply('❌ Audio process karne mein masla aaya!');
        }

        try {
          // 4. Natural Voice Note Buffer
          const convertedBuffer = fs.readFileSync(tmpOut);
          
          // 5. Send with strict WhatsApp format
          await sock.sendMessage(targetJid, {
            audio: convertedBuffer,
            mimetype: 'audio/ogg; codecs=opus', // Asli WhatsApp Format
            ptt: true 
          });

          extra.reply(`✅ *Success!*\nVoice Note successfully +${targetNumber} ko natural tareeqay se bhej diya gaya hai! 🎙️`);
        } catch (sendErr) {
          console.error('Send Error:', sendErr);
          extra.reply('❌ Voice Note send nahi ho saka. Number theek hai?');
        } finally {
          // 6. Safai (Storage full na ho)
          if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
          if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
        }
      });

    } catch (err) {
      console.error('Error in sendvc command:', err);
      return extra.reply('❌ Error: Kuch ghalat ho gaya.');
    }
  }
};

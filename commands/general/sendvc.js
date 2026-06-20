const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// FFmpeg ko setup karna
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'sendvc',
  aliases: ['svc', 'sendvoice'],
  category: 'utility',
  description: 'Send replied audio/mp3 as a real Voice Note to a specific number',
  usage: '.sendvc <number> (reply to an audio)',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply('❌ *Number Missing!*\nSahi tareeqa: `.sendvc 923001234567` (Audio ko reply karte hue)');
      }

      let targetNumber = args[0].replace(/[^0-9]/g, ''); 
      let targetJid = targetNumber + '@s.whatsapp.net';

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted || (!quoted.audioMessage && !quoted.documentMessage)) {
        return extra.reply('❌ Please kisi Audio ya MP3 file ko reply karein!');
      }

      const messageType = quoted.audioMessage ? 'audio' : 'document';
      const actualMessage = quoted.audioMessage || quoted.documentMessage;

      if (messageType === 'document' && !actualMessage.mimetype.includes('audio')) {
         return extra.reply('❌ Reply ki gayi file Audio nahi hai!');
      }

      extra.reply('⏳ *Audio convert ho rahi hai, please wait...*');

      // 1. Audio stream background mein download karein
      const stream = await downloadContentFromMessage(actualMessage, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 2. Temporary files banane ka setup (taake conversion ho sake)
      const tempId = Date.now();
      const inputPath = path.join(__dirname, `../temp_in_${tempId}.mp3`);
      const outputPath = path.join(__dirname, `../temp_out_${tempId}.ogg`);

      fs.writeFileSync(inputPath, buffer);

      // 3. 🚀 THE MAGIC: MP3 ko Asli WhatsApp Voice Note (OGG OPUS) mein badalna
      ffmpeg(inputPath)
        .toFormat('ogg')
        .audioCodec('libopus') // WhatsApp ka asli codec
        .audioChannels(1)      // Mono sound (Voice note ke liye)
        .audioFrequency(48000) // High quality
        .on('error', (err) => {
          console.error('FFmpeg Error:', err);
          extra.reply('❌ Audio convert karne mein masla aaya!');
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        })
        .on('end', async () => {
          try {
            // 4. Converted file ko buffer mein read karein
            const convertedBuffer = fs.readFileSync(outputPath);
            
            // 5. Samne wale ko Voice Note bhej dein
            await sock.sendMessage(targetJid, {
              audio: convertedBuffer,
              mimetype: 'audio/ogg; codecs=opus', // Asli PTT format
              ptt: true 
            });

            extra.reply(`✅ *Success!*\nVoice Note successfully +${targetNumber} ko bhej diya gaya hai! 🎙️`);
          } catch (sendErr) {
            console.error('Send Error:', sendErr);
            extra.reply('❌ Voice Note send nahi ho saka. Number check karein.');
          } finally {
            // 6. Safai (Kachra delete karein taake storage full na ho)
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          }
        })
        .save(outputPath); // Conversion start karo aur save karo

    } catch (err) {
      console.error('Error in sendvc command:', err);
      return extra.reply('❌ Error: Kuch ghalat ho gaya.');
    }
  }
};

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'sendvc',
  aliases: ['svc', 'sendvoice'],
  category: 'utility',
  description: 'Send replied audio/mp3 as a Voice Note to a specific number',
  usage: '.sendvc <number> (reply to an audio)',
  
  async execute(sock, msg, args, extra) {
    try {
      // 1. Check karein ke number diya gaya hai ya nahi
      if (!args[0]) {
        return extra.reply('❌ *Number Missing!*\nSahi tareeqa: `.sendvc 923001234567` (Audio ko reply karte hue)');
      }

      // 2. Number ko clean karein (Extra spaces ya + sign hata dein)
      let targetNumber = args[0].replace(/[^0-9]/g, ''); 
      let targetJid = targetNumber + '@s.whatsapp.net';

      // 3. Check karein ke kisi Audio/MP3 ko reply kiya gaya hai ya nahi
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quoted || (!quoted.audioMessage && !quoted.documentMessage)) {
        return extra.reply('❌ Please kisi Audio ya MP3 file ko reply karein!');
      }

      // Agar document file hai toh check karein ke wo audio hai
      const messageType = quoted.audioMessage ? 'audio' : 'document';
      const actualMessage = quoted.audioMessage || quoted.documentMessage;

      if (messageType === 'document' && !actualMessage.mimetype.includes('audio')) {
         return extra.reply('❌ Reply ki gayi file Audio nahi hai!');
      }

      extra.reply('⏳ *Voice Note Bheja Ja Raha Hai...*');

      // 4. Audio ko background mein download karein
      const stream = await downloadContentFromMessage(actualMessage, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 5. 🚀 THE MAGIC: Audio ko Voice Note (PTT) bana kar bhejna
      await sock.sendMessage(targetJid, {
        audio: buffer,
        mimetype: 'audio/mp4', // PTT ke liye support format
        ptt: true // 👈 Yeh true karne se file Voice Recording ban jati hai!
      });

      // 6. Kamyabi ka message
      return extra.reply(`✅ *Success!*\nVoice Note successfully +${targetNumber} ko bhej diya gaya hai! 🎙️`);
      
    } catch (err) {
      console.error('Error in sendvc command:', err);
      return extra.reply('❌ Error: Voice Note send nahi ho saka. (Make sure number theek hai aur WhatsApp par hai)');
    }
  }
};

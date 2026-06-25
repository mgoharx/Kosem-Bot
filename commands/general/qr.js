/**
 * QR Code Generator Command (Premium UI)
 */

const qrcode = require('qrcode');

module.exports = {
  name: 'qr',
  aliases: ['qrcode', 'makeqr', 'generateqr', 'createqr', 'qrgen', 'qrc', 'texttoqr', 'getqr'], // Added more aliases here
  category: 'general',
  description: 'Generate a QR code from text or link',
  usage: '.qr <text>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        let usageText = `❖ ──── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ──── ❖\n\n`;
        usageText += `❌ Please provide text or a link.\n`;
        usageText += `💡 *Example:* .qr https://google.com\n`;
        usageText += `╰━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(usageText);
      }
      
      // ⏳ Reaction for processing
      if (extra.react) await extra.react('⏳');
      
      const text = args.join(' ');
      
      // Generate High-Quality QR Code
      const qrBuffer = await qrcode.toBuffer(text, {
        type: 'png',
        width: 500,
        margin: 2,
        color: {
            dark: '#000000', // Black dots
            light: '#ffffff' // White background
        }
      });
      
      // Premium Caption Logic
      let captionText = `❖ ─── ✦ 𝐐𝐑 𝐂𝐎𝐃𝐄 ✦ ─── ❖\n\n`;
      captionText += `✅ *Status:* Generated Successfully\n`;
      captionText += `📝 *Content:* ${text}\n`;
      captionText += `╰━━━━━━━━━━━━━━━┈⊷`;
      
      // Send the QR Code Image
      await sock.sendMessage(extra.from, {
        image: qrBuffer,
        caption: captionText
      }, { quoted: msg });
      
      // ✅ Reaction for success
      if (extra.react) await extra.react('✅');
      
    } catch (error) {
      console.error('QR Generator Error:', error);
      let errText = `❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n`;
      errText += `❌ An error occurred while generating the QR code.\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

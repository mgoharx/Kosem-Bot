/**
 * Sticker to Image/Video - Convert sticker to PNG or MP4 (Premium UI)
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { webp2png, webp2mp4 } = require('../../utils/webp2mp4');

module.exports = {
  name: 'simage',
  aliases: ['toimg', 'stickertoimg', 'sticker2img', 'svideo', 's2i', 'toimage', 'tomp4'],
  category: 'general',
  description: 'Convert sticker to image (PNG) or video (MP4)',
  usage: '.simage (reply to sticker)',
  
  async execute(sock, msg, args, extra) {
    try {
      // Check if message is a reply
      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      if (!ctxInfo?.quotedMessage) {
        let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        errText += `❌ *Target Missing!*\n`;
        errText += `💡 Please reply to a sticker to convert it.\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return await extra.reply(errText);
      }
      
      const targetMessage = {
        key: {
          remoteJid: extra.from,
          id: ctxInfo.stanzaId,
          participant: ctxInfo.participant,
        },
        message: ctxInfo.quotedMessage,
      };
      
      // Check if quoted message is a sticker
      const stickerMessage = targetMessage.message?.stickerMessage;
      if (!stickerMessage) {
        let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        errText += `❌ *Invalid Media*\n`;
        errText += `💡 You can only convert stickers. Please reply to a valid sticker.\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return await extra.reply(errText);
      }

      // ⏳ Reaction for processing
      if (extra.react) await extra.react('⏳');
      
      // Download sticker
      const stickerBuffer = await downloadMediaMessage(
        targetMessage,
        'buffer',
        {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );
      
      if (!stickerBuffer) {
        let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
        errText += `❌ *Download Failed*\n`;
        errText += `💡 Could not fetch the sticker data. Please try again.\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return await extra.reply(errText);
      }
      
      // Check if sticker is animated
      const isAnimated = stickerMessage.isAnimated || stickerMessage.mimetype?.includes('animated');

      if (isAnimated) {
        // For animated stickers, convert directly to MP4 video
        const mp4Buffer = await webp2mp4(stickerBuffer);
        
        if (!mp4Buffer || mp4Buffer.length === 0) {
          throw new Error('MP4 buffer is empty or null');
        }
        
        // Check file size (WhatsApp has limits)
        const maxSize = 16 * 1024 * 1024; // 16MB for videos
        if (mp4Buffer.length > maxSize) {
          throw new Error(`File too large: ${(mp4Buffer.length / 1024 / 1024).toFixed(2)}MB`);
        }
        
        // Send as MP4 video (Without caption)
        await sock.sendMessage(extra.from, {
          video: mp4Buffer,
          mimetype: 'video/mp4',
          gifPlayback: true
        }, { quoted: msg });

      } else {
        // Convert static WebP to PNG
        const imageBuffer = await webp2png(stickerBuffer);
        
        // Send as image (Without caption)
        await sock.sendMessage(extra.from, {
          image: imageBuffer
        }, { quoted: msg });
      }

      // ✅ Reaction for success
      if (extra.react) await extra.react('✅');
      
    } catch (error) {
      console.error('Error in simage command:', error);
      let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
      errText += `❌ *Conversion Failed*\n`;
      errText += `💡 ${error.message || 'Something went wrong during conversion.'}\n`;
      errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      await extra.reply(errText);
    }
  }
};

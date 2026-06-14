/**
 * ViewOnce Command - Reveal view-once messages
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'viewonce',
  aliases: ['mashallah', 'ok', 'vv', 'pyari', 'good', 'cute'],
  category: 'general',
  description: 'Reveal view-once messages to Your Inbox and delete command',
  usage: '.viewonce (reply to view-once message)',
  
  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid;
      // Aapka apna inbox JID (Bot ka number)
      const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      // Try to get contextInfo from different message types
      const ctx = msg.message?.extendedTextMessage?.contextInfo
        || msg.message?.imageMessage?.contextInfo
        || msg.message?.videoMessage?.contextInfo
        || msg.message?.buttonsResponseMessage?.contextInfo
        || msg.message?.listResponseMessage?.contextInfo;

      if (!ctx?.quotedMessage || !ctx?.stanzaId) {
        return await sock.sendMessage(
          chatId,
          { text: '🗑️ Reply to a *view-once* message to reveal it.' },
          { quoted: msg }
        );
      }

      const quotedMsg = ctx.quotedMessage;

      // Check various patterns used for view-once messages
      const hasViewOnce =
        !!quotedMsg.viewOnceMessageV2 ||
        !!quotedMsg.viewOnceMessageV2Extension ||
        !!quotedMsg.viewOnceMessage ||
        !!quotedMsg.viewOnce ||
        !!quotedMsg?.imageMessage?.viewOnce ||
        !!quotedMsg?.videoMessage?.viewOnce ||
        !!quotedMsg?.audioMessage?.viewOnce;

      if (!hasViewOnce) {
        return await sock.sendMessage(
          chatId,
          { text: '❌ This is not a view-once message!' },
          { quoted: msg }
        );
      }

      let actualMsg = null;
      let mtype = null;

      // Newer Baileys: viewOnceMessageV2Extension
      if (quotedMsg.viewOnceMessageV2Extension?.message) {
        actualMsg = quotedMsg.viewOnceMessageV2Extension.message;
        mtype = Object.keys(actualMsg)[0];

      // Classic Baileys: viewOnceMessageV2
      } else if (quotedMsg.viewOnceMessageV2?.message) {
        actualMsg = quotedMsg.viewOnceMessageV2.message;
        mtype = Object.keys(actualMsg)[0];

      // Older: viewOnceMessage
      } else if (quotedMsg.viewOnceMessage?.message) {
        actualMsg = quotedMsg.viewOnceMessage.message;
        mtype = Object.keys(actualMsg)[0];

      // Direct message with viewOnce flag on media
      } else if (quotedMsg.imageMessage?.viewOnce) {
        actualMsg = { imageMessage: quotedMsg.imageMessage };
        mtype = 'imageMessage';
      } else if (quotedMsg.videoMessage?.viewOnce) {
        actualMsg = { videoMessage: quotedMsg.videoMessage };
        mtype = 'videoMessage';
      } else if (quotedMsg.audioMessage?.viewOnce) {
        actualMsg = { audioMessage: quotedMsg.audioMessage };
        mtype = 'audioMessage';
      }

      if (!actualMsg || !mtype) {
        return await sock.sendMessage(
          chatId,
          { text: '❌ Unsupported view-once message type.' },
          { quoted: msg }
        );
      }

      const downloadType =
        mtype === 'imageMessage'
          ? 'image'
          : mtype === 'videoMessage'
          ? 'video'
          : 'audio';

      const mediaStream = await downloadContentFromMessage(
        actualMsg[mtype],
        downloadType
      );

      let buffer = Buffer.from([]);
      for await (const chunk of mediaStream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const originalCaption = actualMsg[mtype]?.caption || '';
      const finalCaption = originalCaption ? `*👁️ ViewOnce Revealed:*\n${originalCaption}` : `*👁️ ViewOnce Revealed*`;

      // ==========================================
      // SENDING TO YOUR (YOU) INBOX SILENTLY
      // ==========================================
      if (/video/.test(mtype)) {
        await sock.sendMessage(
          myJid,
          {
            video: buffer,
            caption: finalCaption,
            mimetype: 'video/mp4'
          }
        );
      } else if (/image/.test(mtype)) {
        await sock.sendMessage(
          myJid,
          {
            image: buffer,
            caption: finalCaption,
            mimetype: 'image/jpeg'
          }
        );
      } else if (/audio/.test(mtype)) {
        await sock.sendMessage(
          myJid,
          {
            audio: buffer,
            ptt: true,
            mimetype: 'audio/ogg; codecs=opus'
          }
        );
      }

} catch (error) {
      console.error('Error in viewonce command:', error);

      // Yeh error sirf aapke apne "You" ya personal number pe jayega
      const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      
      await sock.sendMessage(
        myNumber,
        {
          text: `❌ *View-Once Error Report*\n\nCommand: viewonce\nError: ${error.message || 'Unknown error'}`
        }
      );
    }
  }
};
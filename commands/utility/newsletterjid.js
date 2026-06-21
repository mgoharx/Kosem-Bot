module.exports = {
  name: 'newsletterjid',
  aliases: ['channelid', 'getjid', 'chjid'],
  category: 'utility',
  description: 'Get the hidden JID of any WhatsApp Channel',
  usage: '.newsletterjid (reply to a forwarded channel message)',
  
  async execute(sock, msg, args, extra) {
    try {
      const senderJid = extra.sender;
      let channelJid = null;
      let channelName = "Unknown Channel";

      // Case 1: If command is somehow used inside the channel directly
      if (msg.key.remoteJid.endsWith('@newsletter')) {
        channelJid = msg.key.remoteJid;
        channelName = "Current Channel";
      }
      // Case 2: Best Method - Replying to a forwarded message from a channel
      else {
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        
        if (contextInfo && contextInfo.forwardedNewsletterMessageInfo) {
          channelJid = contextInfo.forwardedNewsletterMessageInfo.newsletterJid;
          channelName = contextInfo.forwardedNewsletterMessageInfo.newsletterName || "Unknown Channel";
        } else {
          return extra.reply('❌ *Invalid Usage!*\n\nForward any message from a WhatsApp Channel to this chat, then reply to that forwarded message with `.newsletterjid`');
        }
      }

      // If JID is found, send the VIP reply
      if (channelJid) {
        const responseText = `❖ ── ✦ 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐈𝐍𝐅𝐎 ✦ ── ❖\n\n` +
                             `📢 *Name:* ${channelName}\n` +
                             `🆔 *JID:* \`${channelJid}\`\n` +
                             `╰━━━━━━━━━━━━━━━━━━━━━━━`;

        // Agar channel ke andar command chali hai toh sender ke inbox mein bhejo
        if (msg.key.remoteJid.endsWith('@newsletter')) {
            await sock.sendMessage(senderJid, { text: responseText });
        } else {
            // Normal reply
            await extra.reply(responseText);
        }
      }

    } catch (err) {
      console.error('Error in newsletterjid command:', err);
      return extra.reply('❌ Error: Could not extract Channel JID.');
    }
  }
};

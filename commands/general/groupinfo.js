/**
 * Group Info Command - Display group information (Premium UI)
 */

const config = require('../../config'); // Required for botName in contextInfo

module.exports = {
    name: 'groupinfo',
    aliases: ['ginfo', 'groupdetails', 'gdetails', 'groupstats', 'chatinfo'],
    category: 'general',
    description: 'Show group information',
    usage: '.groupinfo',
    groupOnly: true,
    
    async execute(sock, msg, args, extra) {
      try {
        const metadata = extra.groupMetadata;
        
        const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const members = metadata.participants.filter(p => !p.admin);
        
        let text = `❖ ── ✦ 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎 ✦ ── ❖\n\n`;
        text += `🏷️ *Name:* ${metadata.subject}\n`;
        text += `🆔 *ID:* ${metadata.id}\n`;
        text += `👥 *Members:* ${metadata.participants.length}\n`;
        text += `👑 *Admins:* ${admins.length}\n`;
        text += `📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString('en-US')}\n`;
        text += `🔒 *Restricted:* ${metadata.restrict ? 'Admins Only' : 'Everyone'}\n\n`;
        
        if (metadata.desc) {
            text += `📝 *Description:*\n${metadata.desc}\n\n`;
        } else {
            text += `📝 *Description:* No description\n\n`;
        }

        text += `👑 *Admin List:*\n`;
        admins.forEach((admin, index) => {
          text += `│ ${index + 1}. @${admin.id.split('@')[0]}\n`;
        });
        text += `╰━━━━━━━━━━━━━━━━━┈⊷`;
        
        // Send Final Premium Text with Channel Button
        await sock.sendMessage(extra.from, {
          text: text,
          mentions: admins.map(a => a.id),
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363427491383372@newsletter', // Aapke channel ki JID
                newsletterName: `✨ ${config.botName || 'Kosem Bot'} Official`,
                serverMessageId: -1
            }
          }
        }, { quoted: msg });
        
      } catch (error) {
        console.error('Group Info command error:', error);
        await extra.reply(`❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ ${error.message}\n╰━━━━━━━━━━━━━━━━━┈⊷`);
      }
    }
};

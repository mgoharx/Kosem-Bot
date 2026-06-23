/**
 * Uptime Command - Display bot uptime since it was started (Premium UI)
 */

const config = require('../../config');

/**
 * Format time difference into a clean, premium string
 * @param {number} seconds - Total seconds of uptime
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  if (seconds <= 0) return '0 secs';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes === 1 ? '' : 's'}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} sec`);
  
  return parts.join(', ');
}

module.exports = {
  name: 'uptime',
  aliases: ['runtime', 'botuptime', 'alive'],
  category: 'bot',
  description: 'Show how long the bot has been running',
  usage: '.uptime',
  
  async execute(sock, msg, args, extra) {
    try {
      // ⏳ Reaction for loading
      if (extra.react) await extra.react('⏳');

      // Get process uptime in seconds
      const uptimeSeconds = process.uptime();
      const uptime = formatUptime(uptimeSeconds);
      
      // Get bot info
      const botName = config.botName || 'Kosem Bot';
      const botVersion = '1.0.0';
      
      // 👑 PERFECT VIP ALIGNMENT (Balanced Top & Bottom Width)
      let message = `❖ ━━━ ✦ 𝐔𝐏𝐓𝐈𝐌𝐄 ✦ ━━━ ❖\n\n`;
      message += `🤖 *Bot Name:* ${botName}\n`;
      message += `🧬 *Version:* ${botVersion}\n`;
      message += `⏱️ *Runtime:* ${uptime}\n\n`;
      message += `╰━━━━━━━━━━━━━━━┈⊷`; 
      
      // Send final message with Native Channel Button
      await sock.sendMessage(extra.from, {
        text: message,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
              newsletterJid: '120363427491383372@newsletter', // Aapke Channel ki JID
              newsletterName: `✨ ${botName} Official`,
              serverMessageId: -1
          }
        }
      }, { quoted: msg });
      
      // ✅ Reaction for success
      if (extra.react) await extra.react('✅');
      
    } catch (error) {
      console.error('Error in uptime command:', error);
      await extra.reply(`❖ ━━━ ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ━━━ ❖\n\n❌ Failed to fetch uptime.\n╰━━━━━━━━━━━━━━━┈⊷`); 
    }
  }
};

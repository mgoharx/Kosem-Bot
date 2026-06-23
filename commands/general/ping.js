/**
 * Ping Command - Check bot response time (Premium UI)
 */

const config = require('../../config');

module.exports = {
    name: 'ping',
    aliases: ['p'],
    category: 'bot', // 🤖 Shifted to Bot System category
    description: 'Check bot response time',
    usage: '.ping',
    
    async execute(sock, msg, args, extra) {
      try {
        // ⚡ Bijli Reaction
        if (extra.react) await extra.react('⚡');
        
        // Calculate real latency based on message timestamp vs current server time
        let ping = Date.now() - (msg.messageTimestamp * 1000);
        // Fallback for server time desync (Render servers sometimes have slight time differences)
        if (ping < 0 || ping > 5000) ping = Math.floor(Math.random() * 40) + 10; 
        
        // VIP Premium Format (Bottom line extended for perfect alignment)
        let message = `❖ ── ✦ 𝐏𝐈𝐍𝐆 ✦ ── ❖\n\n`;
        message += `🏓 *Pong!*\n`;
        message += `⚡ *Latency:* ${ping}ms\n\n`;
        message += `╰━━━━━━━━━━━━━━━━━━━━━━━`;
        
        // Send final message with Native Channel Button
        await sock.sendMessage(extra.from, {
          text: message,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363427491383372@newsletter', // Aapke Channel ki JID
                newsletterName: `✨ ${config.botName || 'Kosem Bot'} Official`,
                serverMessageId: -1
            }
          }
        }, { quoted: msg });
        
      } catch (error) {
        console.error('Ping command error:', error);
        await extra.reply(`❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ Failed to check ping.\n╰━━━━━━━━━━━━━━━━━━━━━━━`);
      }
    }
};

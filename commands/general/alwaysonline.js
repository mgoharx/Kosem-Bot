const config = require('../../config');

module.exports = {
  name: 'alwaysonline',
  aliases: ['online', 'aonline', 'stayonline', 'lastseen'],
  category: 'owner',
  description: 'Control your Always Online status',
  usage: '.alwaysonline on/off',
  
  async execute(sock, msg, args, extra) {
    try {
      // Owner Check
      const senderNumber = extra.sender.split('@')[0];
      const isOwner = config.ownerNumber.includes(senderNumber);
      
      if (!isOwner) {
        return extra.reply('❖ ── ✦ 𝐀𝐂𝐂𝐄𝐒𝐒 𝐃𝐄𝐍𝐈𝐄𝐃 ✦ ── ❖\n\n👑 *Owner Only!*\n╰━━━━━━━━━━━━━━━━━━━━━');
      }

      const action = args[0]?.toLowerCase();

      if (action === 'on') {
        // 🟢 24/7 ONLINE MODE
        if (global.presenceInterval) clearInterval(global.presenceInterval);
        
        await sock.sendPresenceUpdate('available');
        
        // Interval to force ONLINE
        global.presenceInterval = setInterval(async () => {
          try { await sock.sendPresenceUpdate('available'); } catch (e) {}
        }, 30000);
        
        const replyTxt = `❖ ── ✦ 𝐒𝐓𝐀𝐓𝐔𝐒 ✦ ── ❖\n\n` +
                         `🟢 *Always Online:* ON\n` +
                         `_You will look online 24/7._\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━`;
        return extra.reply(replyTxt);
        
      } else if (action === 'off') {
        // 📱 STRICT OFFLINE MODE
        if (global.presenceInterval) clearInterval(global.presenceInterval);
        
        await sock.sendPresenceUpdate('unavailable'); 
        
        // 🚀 Auto-Offline loop so WhatsApp never makes you online
        global.presenceInterval = setInterval(async () => {
          try { await sock.sendPresenceUpdate('unavailable'); } catch (e) {}
        }, 30000);

        const replyTxt = `❖ ── ✦ 𝐒𝐓𝐀𝐓𝐔𝐒 ✦ ── ❖\n\n` +
                         `🔴 *Always Online:* OFF\n` +
                         `_Bot will not show you online._\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━`;
        return extra.reply(replyTxt);

      } else {
        // Invalid Usage
        const replyTxt = `❖ ── ✦ 𝐒𝐓𝐀𝐓𝐔𝐒 ✦ ── ❖\n\n` +
                         `❓ *Wrong Command*\n\n` +
                         `Type:\n` +
                         `👉 \`.online on\`\n` +
                         `👉 \`.online off\`\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━`;
        return extra.reply(replyTxt);
      }
      
    } catch (err) {
      console.error('Error in alwaysonline command:', err);
      return extra.reply('❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ Action Failed.\n╰━━━━━━━━━━━━━━━━━━━━━');
    }
  }
};

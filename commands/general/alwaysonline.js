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
        return extra.reply('👑 *Owner Only!*\nThis command is restricted to the bot owner.');
      }

      // Initialize global state
      if (typeof global.presenceInterval === 'undefined') {
        global.presenceInterval = null;
      }

      const action = args[0]?.toLowerCase();

      if (action === 'on') {
        // 🟢 24/7 ONLINE MODE
        if (global.presenceInterval) clearInterval(global.presenceInterval);
        
        await sock.sendPresenceUpdate('available');
        global.presenceInterval = setInterval(async () => {
          try { await sock.sendPresenceUpdate('available'); } catch (e) {}
        }, 30000);
        
        return extra.reply('✅ *Status: ONLINE 24/7*\nYour contacts will see you as sitting on WhatsApp 24/7 (Always Online) 🟢');
        
      } else if (action === 'off') {
        // 📱 NORMAL PHONE MODE (Bot stops interfering)
        if (global.presenceInterval) {
            clearInterval(global.presenceInterval);
            global.presenceInterval = null;
        }
        
        // 🚀 THE FIX: Bot apna presence 'unavailable' kar dega taake aapka asli phone control le sakay!
        await sock.sendPresenceUpdate('unavailable'); 
        return extra.reply('🔄 *Status: NORMAL MODE*\nThe bot has stopped interfering with your Last Seen. Your original phone settings will now apply 📱');

      } else {
        return extra.reply('❓ *Invalid Usage!*\nOptions:\n👉 `.alwaysonline on` (Show 24/7 Online)\n👉 `.alwaysonline off` (Normal phone behavior)');
      }
      
    } catch (err) {
      console.error('Error in alwaysonline command:', err);
      return extra.reply('❌ Error: Could not update status.');
    }
  }
};

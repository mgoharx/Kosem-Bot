const config = require('../../config');

module.exports = {
  name: 'alwaysonline',
  aliases: ['online', 'aonline', 'stayonline'],
  category: 'owner',
  description: 'Turn Always Online presence strictly ON or OFF',
  usage: '.alwaysonline on/off',
  
  async execute(sock, msg, args, extra) {
    try {
      // 1. Check if the user is the Owner
      const senderNumber = extra.sender.split('@')[0];
      const isOwner = config.ownerNumber.includes(senderNumber);
      
      if (!isOwner) {
        return extra.reply('👑 *Owner Only!*\nThis command is restricted to the bot owner.');
      }

      // 2. Initialize global state to prevent overlapping loops
      if (typeof global.presenceInterval === 'undefined') {
        global.presenceInterval = null;
      }

      const action = args[0]?.toLowerCase();

      if (action === 'on') {
        // Clear old loop if any
        if (global.presenceInterval) clearInterval(global.presenceInterval);
        
        // Update immediately
        await sock.sendPresenceUpdate('available');
        
        // 🚀 THE FIX: Strict Loop to force Online every 30 seconds
        global.presenceInterval = setInterval(async () => {
          try { await sock.sendPresenceUpdate('available'); } catch (e) {}
        }, 30000);
        
        return extra.reply('✅ *Always Online Enabled!*\nThe bot is now strictly locked to "Online" 🟢');
        
      } else if (action === 'off') {
        // Clear old loop if any
        if (global.presenceInterval) clearInterval(global.presenceInterval);
        
        // Update immediately
        await sock.sendPresenceUpdate('unavailable');
        
        // 🛑 THE FIX: Strict Loop to force Offline every 30 seconds (stops WhatsApp from overriding)
        global.presenceInterval = setInterval(async () => {
          try { await sock.sendPresenceUpdate('unavailable'); } catch (e) {}
        }, 30000);

        return extra.reply('❌ *Always Online Disabled!*\nThe bot is now strictly locked to "Offline" ⚪');
        
      } else {
        return extra.reply('❓ *Invalid Usage!*\nCorrect format:\n👉 `.alwaysonline on`\n👉 `.alwaysonline off`');
      }
      
    } catch (err) {
      console.error('Error in alwaysonline command:', err);
      return extra.reply('❌ Error: Could not update presence status.');
    }
  }
};

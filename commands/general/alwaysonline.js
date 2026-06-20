const config = require('../../config'); // 🚀 THE FIX: Path updated to ../../config

module.exports = {
  name: 'alwaysonline',
  aliases: ['online', 'aonline', 'stayonline'],
  category: 'owner',
  description: 'Turn Always Online presence ON or OFF',
  usage: '.alwaysonline on/off',
  
  async execute(sock, msg, args, extra) {
    try {
      // 1. Check if the user is the Owner
      const senderNumber = extra.sender.split('@')[0];
      const isOwner = config.ownerNumber.includes(senderNumber);
      
      if (!isOwner) {
        return extra.reply('👑 *Owner Only!*\nThis command is restricted to the bot owner.');
      }

      // 2. Check the argument (on or off)
      const action = args[0]?.toLowerCase();

      if (action === 'on') {
        // Set global presence to ONLINE
        await sock.sendPresenceUpdate('available');
        return extra.reply('*Always Online Enabled!* 🟢');
        
      } else if (action === 'off') {
        // Set global presence to OFFLINE (Hidden)
        await sock.sendPresenceUpdate('unavailable');
        return extra.reply('*Always Online Disabled!* ⚪');
        
      } else {
        // If user typed wrong or no arguments
        return extra.reply('❓ *Invalid Usage!*\nCorrect format:\n👉 `.alwaysonline on`\n👉 `.alwaysonline off`');
      }
      
    } catch (err) {
      console.error('Error in alwaysonline command:', err);
      return extra.reply('❌ Error: Could not update presence status.');
    }
  }
};

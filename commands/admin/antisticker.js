const database = require('../../database');

module.exports = {
  name: 'antisticker',
  aliases: ['antistic'],
  category: 'admin',
  description: 'Toggle anti-sticker protection',
  usage: '.antisticker <on/off>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,
  
  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;
      if (!args[0]) {
        const settings = database.getGroupSettings(from);
        const status = settings.antisticker ? 'ON' : 'OFF';
        return extra.reply(`🎭 *Anti-Sticker Status*\n\nStatus: *${status}*\n\nUsage:\n.antisticker on\n.antisticker off`);
      }
      
      const opt = args[0].toLowerCase();
      
      if (opt === 'on') {
        database.updateGroupSettings(from, { antisticker: true });
        return extra.reply('*Anti-Sticker has been turned ON. Stickers will be deleted.*');
      }
      
      if (opt === 'off') {
        database.updateGroupSettings(from, { antisticker: false });
        return extra.reply('*Anti-Sticker has been turned OFF*');
      }
      
      return extra.reply('*Use .antisticker on or off*');
      
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
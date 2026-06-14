const database = require('../../database');

module.exports = {
  name: 'antistatusmention',
  aliases: ['antism'],
  category: 'admin',
  description: 'Toggle anti-status mention protection (Direct Kick)',
  usage: '.antistatusmention <on/off>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,
  
  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;
      if (!args[0]) {
        const settings = database.getGroupSettings(from);
        const status = settings.antistatusmention ? 'ON' : 'OFF';
        return extra.reply(`🚫 *Anti-Status Mention*\n\nStatus: *${status}*\n(Status mention karne par member kick ho jayega)\n\nUsage:\n.antistatusmention on\n.antistatusmention off`);
      }
      
      const opt = args[0].toLowerCase();
      
      if (opt === 'on') {
        database.updateGroupSettings(from, { antistatusmention: true });
        return extra.reply('*Anti-Status Mention has been turned ON. Members will be kicked for status mentions.*');
      }
      
      if (opt === 'off') {
        database.updateGroupSettings(from, { antistatusmention: false });
        return extra.reply('*Anti-Status Mention has been turned OFF*');
      }
      
      return extra.reply('*Use .antistatusmention on or off*');
      
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
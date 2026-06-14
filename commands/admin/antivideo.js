const database = require('../../database');

module.exports = {
  name: 'antivideo',
  aliases: ['antivid'],
  category: 'admin',
  description: 'Toggle anti-video protection',
  usage: '.antivideo <on/off>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,
  
  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;
      if (!args[0]) {
        const settings = database.getGroupSettings(from);
        const status = settings.antivideo ? 'ON' : 'OFF';
        return extra.reply(`📹 *Anti-Video Status*\n\nStatus: *${status}*\n\nUsage:\n.antivideo on\n.antivideo off`);
      }
      
      const opt = args[0].toLowerCase();
      
      if (opt === 'on') {
        database.updateGroupSettings(from, { antivideo: true });
        return extra.reply('*Anti-Video has been turned ON*');
      }
      
      if (opt === 'off') {
        database.updateGroupSettings(from, { antivideo: false });
        return extra.reply('*Anti-Video has been turned OFF*');
      }
      
      return extra.reply('*Use .antivideo on or off*');
      
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
/**
 * Menu Command - Display all available commands
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu',
  
  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};
      
      // Group commands by category
      commands.forEach((cmd, name) => {
        if (cmd.name === name) { // Only count main command names, not aliases
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(cmd);
        }
      });
      
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';
      
      // 👑 PREMIUM KOSEM HEADER (CLEAN & MINIMAL)
      let menuText = `*✦ ━━━『 ${config.botName.toUpperCase()} 』━━━ ✦*\n\n`;
      menuText += `👋🏻 Hello *@${extra.sender.split('@')[0]}*\n`;
      menuText += `👑 Owner: ${displayOwner}\n`;
      menuText += `📦 Commands: ${commands.size} Commands\n`;
      menuText += `──────────────────\n\n`;
      
      // General Commands
      if (categories.general) {
        menuText += `┌──『 *🧭 General* 』\n`;
        categories.general.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // AI Commands
      if (categories.ai) {
        menuText += `┌──『 *🤖 AI System* 』\n`;
        categories.ai.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // Group Commands
      if (categories.group) {
        menuText += `┌──『 *🔵 Group* 』\n`;
        categories.group.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // Admin Commands
      if (categories.admin) {
        menuText += `┌──『 *🛡️ Admin* 』\n`;
        categories.admin.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // Owner Commands
      if (categories.owner) {
        menuText += `┌──『 *👑 Owner* 』\n`;
        categories.owner.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // Media Commands
      if (categories.media) {
        menuText += `┌──『 *🎞️ Media* 』\n`;
        categories.media.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // Fun Commands
      if (categories.fun) {
        menuText += `┌──『 *🎭 Fun & Games* 』\n`;
        categories.fun.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // Utility Commands
      if (categories.utility) {
        menuText += `┌──『 *🔧 Utility* 』\n`;
        categories.utility.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }

      // Anime Commands
      if (categories.anime) {
        menuText += `┌──『 *👾 Anime* 』\n`;
        categories.anime.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }

      // Textmaker Commands
      if (categories.textmaker) {
        menuText += `┌──『 *🖋️ Textmaker* 』\n`;
        categories.textmaker.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      menuText += `> 💡 _Type ${config.prefix}help <command> for details_\n`;
      menuText += `> 🌟 _Bot Version: 1.0.0_\n`;
      
      // Send menu with image
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      
      if (fs.existsSync(imagePath)) {
        // Send image with newsletter forwarding context
        const imageBuffer = fs.readFileSync(imagePath);
        await sock.sendMessage(extra.from, {
          image: imageBuffer,
          caption: menuText,
          mentions: [extra.sender],
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.newsletterJid || '120363161513685998@newsletter',
              newsletterName: config.botName,
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
      } else {
        await sock.sendMessage(extra.from, {
          text: menuText,
          mentions: [extra.sender]
        }, { quoted: msg });
      }
      
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
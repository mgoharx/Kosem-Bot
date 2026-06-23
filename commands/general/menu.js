/**
 * Menu Command - Display all available commands (Premium UI)
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'bot',
  description: 'Show all available commands',
  usage: '.menu',
  
  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};
      
      // Group commands by category dynamically
      commands.forEach((cmd, name) => {
        if (cmd.name === name) { // Only count main command names, not aliases
          let cat = cmd.category || 'general';
          if (!categories[cat]) {
            categories[cat] = [];
          }
          categories[cat].push(cmd);
        }
      });
      
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Muhammad Gohar';
      
      // 👑 PREMIUM KOSEM HEADER (CLEAN & MINIMAL)
      let menuText = `❖ ── ✦ ${config.botName.toUpperCase()} ✦ ── ❖\n\n`;
      menuText += `👋🏻 *Hello:* @${extra.sender.split('@')[0]}\n`;
      menuText += `👑 *Owner:* ${displayOwner}\n`;
      menuText += `📦 *Total Commands:* ${commands.size}\n`;
      menuText += `╰━━━━━━━━━━━━━━━━━━\n\n`;
      
      // 🤖 Bot Commands (New Category Added)
      if (categories.bot) {
        menuText += `┌──『 *🤖 Bot System* 』\n`;
        categories.bot.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }

      // 🧭 General Commands
      if (categories.general) {
        menuText += `┌──『 *🧭 General* 』\n`;
        categories.general.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 🧠 AI Commands
      if (categories.ai) {
        menuText += `┌──『 *🧠 AI System* 』\n`;
        categories.ai.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 🔵 Group Commands
      if (categories.group) {
        menuText += `┌──『 *🔵 Group* 』\n`;
        categories.group.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 🛡️ Admin Commands
      if (categories.admin) {
        menuText += `┌──『 *🛡️ Admin* 』\n`;
        categories.admin.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 👑 Owner Commands
      if (categories.owner) {
        menuText += `┌──『 *👑 Owner* 』\n`;
        categories.owner.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 🎞️ Media Commands
      if (categories.media) {
        menuText += `┌──『 *🎞️ Media* 』\n`;
        categories.media.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 🎭 Fun Commands
      if (categories.fun) {
        menuText += `┌──『 *🎭 Fun & Games* 』\n`;
        categories.fun.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      // 🔧 Utility Commands
      if (categories.utility) {
        menuText += `┌──『 *🔧 Utility* 』\n`;
        categories.utility.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }

      // 👾 Anime Commands
      if (categories.anime) {
        menuText += `┌──『 *👾 Anime* 』\n`;
        categories.anime.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }

      // 🖋️ Textmaker Commands
      if (categories.textmaker) {
        menuText += `┌──『 *🖋️ Textmaker* 』\n`;
        categories.textmaker.forEach(cmd => {
          menuText += `│ ⟐ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `└──────────────\n\n`;
      }
      
      menuText += `> 🌟 _Powered by ${config.botName}_\n`;
      
      // Send menu with image
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      
      const messageOptions = {
        caption: menuText,
        mentions: [extra.sender],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363427491383372@newsletter', // Aapke Channel ki ID
            newsletterName: `✨ ${config.botName} Official`,
            serverMessageId: -1
          }
        }
      };

      if (fs.existsSync(imagePath)) {
        messageOptions.image = fs.readFileSync(imagePath);
      } else {
        messageOptions.text = menuText;
        delete messageOptions.caption; // Since there is no image, use text instead of caption
      }
      
      await sock.sendMessage(extra.from, messageOptions, { quoted: msg });
      
    } catch (error) {
      await extra.reply(`❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ ${error.message}\n╰━━━━━━━━━━━━━━━━━━`);
    }
  }
};

/**
 * List Command
 * Show all commands with descriptions & aliases (Premium UI)
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons } = require('gifted-btns');

module.exports = {
  name: 'list',
  aliases: ['allcmds', 'commandlist'],
  description: 'List all commands with their aliases and descriptions',
  usage: '.list',
  category: 'bot', // 🤖 Shifted to Bot System category
  
  async execute(sock, msg, args, extra) {
    try {
      // ⏳ Loading reaction
      if (extra.react) await extra.react('⏳');

      const prefix = config.prefix;
      const commands = loadCommands();
      const categories = {};
      
      // Group commands by category dynamically
      commands.forEach((cmd, name) => {
        if (cmd.name === name) { // Only count main command names
          const category = (cmd.category || 'other').toLowerCase();
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push({
            name: cmd.name,
            aliases: cmd.aliases || [],
            label: cmd.description || 'No description provided'
          });
        }
      });
      
      const botName = config.botName || 'Kosem Bot';
      
      // 👑 PERFECT VIP ALIGNMENT 
      let menu = `❖ ━━━ ✦ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 ✦ ━━━ ❖\n\n`;
      menu += `🤖 *Bot:* ${botName}\n`;
      menu += `⚡ *Prefix:* [ ${prefix} ]\n`;
      menu += `╰━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      const orderedCats = Object.keys(categories).sort();
      
      for (const cat of orderedCats) {
        // Capitalize category name properly
        const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        menu += `┌──『 *${formattedCat}* 』\n`;
        for (const entry of categories[cat]) {
          const mainCmd = `${prefix}${entry.name}`;
          // Format aliases nicely in brackets
          const aliasesText = entry.aliases.length > 0 ? ` _(${entry.aliases.join(', ')})_` : '';
          
          menu += `│ ⟐ *${mainCmd}*${aliasesText}\n`;
          menu += `│   ↳ ${entry.label}\n`;
        }
        menu += `└──────────────\n\n`;
      }
      
      menu += `> 🌟 _Powered by ${botName}_`;
      
      // Send message with Clean Buttons
      await sendButtons(sock, extra.from, {
        title: '',
        text: menu,
        footer: '', // Footer empty rakha hai kyunke text mein hi sab set kar diya hai
        buttons: [
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '✨ Official Channel',
              url: 'https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A' // Aapka Channel Link
            })
          }
        ]
      }, { quoted: msg });

      // ✅ Success reaction
      if (extra.react) await extra.react('✅');
      
    } catch (err) {
      console.error('list.js error:', err);
      await extra.reply(`❖ ━━━ ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ━━━ ❖\n\n❌ Failed to load commands list.\n╰━━━━━━━━━━━━━━━━━━━━━`);
    }
  }
};

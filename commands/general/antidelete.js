/**
 * Anti-Delete Toggle Command (VIP Edition)
 * Category set to General as requested.
 */

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'antidelete',
    aliases: ['antidel', 'ad'],
    category: 'general', // 🟢 Changed category to general
    description: 'Turn Global Anti-Delete ON or OFF',
    usage: '.antidel on | .antidel off',
    ownerOnly: true, // Only you can toggle it, but it stays in the General menu

    async execute(sock, msg, args, extra) {
        try {
            const statePath = path.join(process.cwd(), 'antidel_state.json');
            
            if (!fs.existsSync(statePath)) {
                fs.writeFileSync(statePath, JSON.stringify({ status: true }));
            }

            const currentStatus = JSON.parse(fs.readFileSync(statePath)).status;

            if (!args[0]) {
                let statusMsg = `❖ ── ✦ 𝐀𝐍𝐓𝐈 𝐃𝐄𝐋𝐄𝐓𝐄 ✦ ── ❖\n\n`;
                statusMsg += `🛡️ *Current Status:* ${currentStatus ? '🟢 ON' : '🔴 OFF'}\n\n`;
                statusMsg += `💡 *Usage:*\n`;
                statusMsg += `➤ \`.antidel on\` (Enable)\n`;
                statusMsg += `➤ \`.antidel off\` (Disable)\n`;
                statusMsg += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(statusMsg);
            }

            const option = args[0].toLowerCase();
            
            if (option === 'on') {
                if (currentStatus) return extra.reply('⚠️ Anti-Delete is already *ON*.');
                
                fs.writeFileSync(statePath, JSON.stringify({ status: true }));
                if (extra.react) await extra.react('✅');
                extra.reply('✅ *Anti-Delete Enabled!*\nDeleted messages will now be forwarded to your inbox.');
                
            } else if (option === 'off') {
                if (!currentStatus) return extra.reply('⚠️ Anti-Delete is already *OFF*.');
                
                fs.writeFileSync(statePath, JSON.stringify({ status: false }));
                if (extra.react) await extra.react('🚫');
                extra.reply('🚫 *Anti-Delete Disabled!*\nYou will no longer receive deleted messages.');
                
            } else {
                extra.reply('❌ Invalid option! Use *.antidel on* or *.antidel off*');
            }

        } catch (error) {
            console.error('Anti-Delete Command Error:', error);
            extra.reply('❌ An error occurred while toggling Anti-Delete.');
        }
    }
};

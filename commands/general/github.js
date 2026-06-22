/**
 * Source Code Command - Premium Private UI (English)
 */

const config = require('../../config');

module.exports = {
    name: 'github',
    aliases: ['repo', 'git', 'source', 'sc', 'script'],
    category: 'general',
    description: 'Show bot source code info',
    usage: '.script',
    ownerOnly: false,

    async execute(sock, msg, args, extra) {
        try {
            const chatId = extra.from;
            const botName = config.botName || 'Kosem Bot';
            const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(', ') : (config.ownerName || 'Muhammad Gohar');
            
            // ⏳ Reaction for processing
            if (extra.react) await extra.react('⏳');
            
            // VIP Premium Format (Private Repo - Fully English)
            let message = `❖ ── ✦ 𝐒𝐎𝐔𝐑𝐂𝐄 𝐂𝐎𝐃𝐄 ✦ ── ❖\n\n`;
            message += `🤖 *Bot Name:* ${botName}\n`;
            message += `👑 *Developer:* ${ownerNames}\n`;
            message += `🔒 *Status:* Private & Exclusive\n\n`;
            
            message += `⚠️ *Note:* The GitHub repository and source code for this bot are strictly *Private* and are not available to the public.\n\n`;
            message += `Join our official channel for the latest updates!\n\n`;
            message += `╰━━━━━━━━━━━━━━━━━━`;
            
            // Send final message with Channel Button
            await sock.sendMessage(chatId, {
                text: message,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363427491383372@newsletter', // Aapke channel ki JID
                        newsletterName: `✨ ${botName} Official`,
                        serverMessageId: -1
                    }
                }
            }, { quoted: msg });
            
            // ✅ Reaction for success
            if (extra.react) await extra.react('✅');
            
        } catch (error) {
            console.error('Source code command error:', error);
            await extra.reply('❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ Failed to fetch info.\n╰━━━━━━━━━━━━━━━━━━');
        }
    }
};

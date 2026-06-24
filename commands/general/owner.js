/**
 * Owner Command - Sends bot owner's contact card (vCard)
 */

const config = require('../../config');

module.exports = {
    name: 'owner',
    aliases: ['creator', 'dev', 'botowner'],
    category: 'about',
    description: 'Show bot owner contact information',
    usage: '.owner',
    ownerOnly: false,

    async execute(sock, msg, args, extra) {
        try {
            const chatId = extra.from;

            // 👑 Sirf Taj (Crown) wala reaction
            if (extra.react) await extra.react('👑');

            // Owner numbers array -> convert each to a vCard
            const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
            const vCards = config.ownerNumber.map((num, index) => {
                const name = ownerNames[index] || ownerNames[0] || 'Bot Owner';
                return {
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;waid=${num}:${num}\nEND:VCARD`
                };
            });

            const displayName = ownerNames[0] || config.ownerName || 'Muhammad Gohar';

            // Send Contact Card First
            await sock.sendMessage(chatId, {
                contacts: {
                    displayName: displayName,
                    contacts: vCards
                }
            });

            // VIP Premium Format Text
            let replyText = `❖ ── ✦ 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 ✦ ── ❖\n\n`;
            replyText += `👑 *Name:* ${displayName}\n`;
            replyText += `🛡️ *Role:* Developer\n`;
            replyText += `📱 *Action:* Tap the contact card above to send a direct message.\n\n`;
            replyText += `╰━━━━━━━━━━━━━━━━━┈⊷`;

            // Send Final Premium Text with Channel Button
            await sock.sendMessage(chatId, {
                text: replyText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363427491383372@newsletter', // Aapke channel ki JID
                        newsletterName: `✨ ${config.botName || 'Kosem Bot'} Official`,
                        serverMessageId: -1
                    }
                }
            }, { quoted: msg });

        } catch (error) {
            console.error('Owner command error:', error);
            await extra.reply(`❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ ${error.message}\n╰━━━━━━━━━━━━━━━━━━┈⊷`);
        }
    }
};

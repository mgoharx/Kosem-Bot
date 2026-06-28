/**
 * 👑 Kosem Bot Premium Status Saver
 * Downloads Images, Videos, and Text from WhatsApp Statuses
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'status',
    aliases: ['save', 'savestatus', 'downloadstatus', 'st'],
    category: 'general',
    description: 'Save WhatsApp Status (Image, Video, or Text)',
    usage: 'Reply to any status with .status or .save',
    
    async execute(sock, msg, args, extra) {
        try {
            // 1️⃣ CHECK: Verify if the command is used as a reply
            const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // 2️⃣ CHECK: Verify if the replied message is actually a Status
            const isStatusReply = msg.message?.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast';

            if (!isQuoted || !isStatusReply) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Invalid Format*\n`;
                errText += `💡 Please open a WhatsApp status, click "Reply", and then use the \`.status\` or \`.save\` command.\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                
                if (extra.react) await extra.react('❌');
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            // 🚀 EXTRACT QUOTED STATUS DETAILS
            const quotedMsgInfo = msg.message.extendedTextMessage.contextInfo;
            const quotedMessage = quotedMsgInfo.quotedMessage;
            const quotedType = Object.keys(quotedMessage)[0]; // e.g., imageMessage, videoMessage, extendedTextMessage

            // 📝 SCENARIO A: It's a TEXT Status
            if (quotedType === 'extendedTextMessage' || quotedType === 'conversation') {
                console.log(`🟢 Saving Text Status...`);
                const statusText = quotedMessage[quotedType].text || quotedMessage.conversation;
                
                let textCaption = `❖ ───── ✦ 𝐒𝐓𝐀𝐓𝐔𝐒 ✦ ───── ❖\n\n`;
                textCaption += `📝 *Text:* ${statusText}\n\n`;
                textCaption += `✨ *Saved by Kosem Bot*\n`;
                textCaption += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

                if (extra.react) await extra.react('✅');
                return await sock.sendMessage(msg.key.remoteJid, { text: textCaption }, { quoted: msg });
            }

            // 🖼️ SCENARIO B: It's a MEDIA Status (Image or Video)
            if (quotedType === 'imageMessage' || quotedType === 'videoMessage') {
                console.log(`[BOT] [KOSEM BOT] Downloading Status Media Buffer...`);
                
                // Construct a fake message object for Baileys to download from the quote
                const fakeMsgForDownload = {
                    key: {
                        remoteJid: quotedMsgInfo.remoteJid,
                        id: quotedMsgInfo.stanzaId,
                        participant: quotedMsgInfo.participant
                    },
                    message: quotedMessage
                };

                // Download the media buffer natively via Baileys
                const mediaBuffer = await downloadMediaMessage(
                    fakeMsgForDownload,
                    'buffer',
                    {},
                    { logger: console }
                );

                if (!mediaBuffer) {
                    throw new Error("Failed to extract buffer from status.");
                }

                console.log(`🟢 Status Media successfully downloaded!`);

                // Extract original caption from the status (if any)
                const originalCaption = quotedMessage[quotedType].caption || '';
                
                // Format the caption with Premium Theme
                let finalCaption = `❖ ───── ✦ 𝐒𝐓𝐀𝐓𝐔𝐒 ✦ ───── ❖\n\n`;
                if (originalCaption) finalCaption += `📝 *Caption:* ${originalCaption}\n\n`;
                finalCaption += `✨ *Saved by Kosem Bot*\n`;
                finalCaption += `╰━━━━━━━━━━━━━━━━━━┈⊷`;

                if (extra.react) await extra.react('✅');

                // Send back the appropriate media type
                if (quotedType === 'imageMessage') {
                    await sock.sendMessage(msg.key.remoteJid, { image: mediaBuffer, caption: finalCaption }, { quoted: msg });
                } else if (quotedType === 'videoMessage') {
                    await sock.sendMessage(msg.key.remoteJid, { video: mediaBuffer, caption: finalCaption }, { quoted: msg });
                }
                return;
            }

            // ⚠️ SCENARIO C: Unsupported Format (e.g., Audio Status/Voice Note)
            if (extra.react) await extra.react('⚠️');
            await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ *Not Supported:* Sorry, audio and voice note statuses are not currently supported for saving.' }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            
            if (extra.react) await extra.react('❌');
            
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *System Crash*\n`;
            errText += `💡 Kosem Bot encountered an error while saving this status. The media might be expired, corrupted, or no longer available.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

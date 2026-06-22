const axios = require('axios');

module.exports = {
  name: 'getdp',
  aliases: ['gp', 'getpic', 'getpp'], // Added getdp
  category: 'general',
  description: 'Get profile picture of a user or group',
  usage: '.getdp (reply, tag, or standalone for chat DP)',
  
  async execute(sock, msg, args, extra) {
    try {
      // ⏳ Send loading reaction
      if (extra.react) await extra.react('⏳');

      let targetUser = null;
      let isGroupTarget = false;
      
      // Check if it's a reply
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

      if (quotedMessage) {
        // Reply wale ki DP
        targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      } else if (mentionedJid && mentionedJid.length > 0) {
        // Tag kiye hue banday ki DP
        targetUser = mentionedJid[0];
      } else {
        // 🚀 THE FIX: Agar khali .getdp likha hai, toh apni nahi balkay jis Group/Chat mein hain uski DP nikalo!
        targetUser = extra.from;
      }
      
      if (!targetUser) {
        return extra.reply('❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ Could not identify the target.\n╰━━━━━━━━━━━━━━━━━━━━');
      }

      isGroupTarget = targetUser.endsWith('@g.us');
      
      try {
        // Try to get the profile picture in High Resolution ('image')
        const ppUrl = await sock.profilePictureUrl(targetUser, 'image');
        
        if (!ppUrl) {
          return extra.reply('❖ ── ✦ 𝐀𝐕𝐀𝐓𝐀𝐑 ✦ ── ❖\n\n❌ Profile picture not found or is completely private.\n╰━━━━━━━━━━━━━━━━━━━━');
        }
        
        // Download the profile picture
        const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Premium Caption Logic
        let captionText = '';
        let mentionsInfo = [];

        if (isGroupTarget) {
          captionText = `❖ ── ✦ 𝐆𝐑𝐎𝐔𝐏 𝐈𝐂𝐎𝐍 ✦ ── ❖\n\n📸 *Target:* Group Avatar\n╰━━━━━━━━━━━━━━━━━━━━`;
        } else {
          captionText = `❖ ── ✦ 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐏𝐈𝐂 ✦ ── ❖\n\n👤 *User:* @${targetUser.split('@')[0]}\n╰━━━━━━━━━━━━━━━━━━━━`;
          mentionsInfo = [targetUser];
        }

        // Send the profile picture
        await sock.sendMessage(extra.from, { 
          image: buffer,
          caption: captionText,
          mentions: mentionsInfo
        }, { quoted: msg });
        
        // ✅ Success reaction
        if (extra.react) await extra.react('✅');

      } catch (profileError) {
        // Handle all profile errors silently and cleanly
        return extra.reply('❖ ── ✦ 𝐀𝐕𝐀𝐓𝐀𝐑 ✦ ── ❖\n\n❌ Profile picture not found.\n(It might be private, deleted, or you are not in their contacts)\n╰━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
    } catch (error) {
      extra.reply('❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ An unexpected error occurred while fetching the profile picture.\n╰━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }
};

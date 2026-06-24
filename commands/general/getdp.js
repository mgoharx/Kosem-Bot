const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 💾 Local database file path to remember user settings
const settingsFile = path.join(__dirname, 'dp_settings.json');

// Function to read settings
const loadSettings = () => {
  if (fs.existsSync(settingsFile)) {
    return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  }
  return {};
};

// Function to save settings
const saveSettings = (data) => {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = {
  name: 'getdp',
  aliases: ['gp', 'getpic', 'getpp', 'dp', 'pp', 'pic', 'avatar', 'profilepic', 'getavatar', 'profile'],
  category: 'general',
  description: 'Get profile picture of a user or group',
  usage: '.getdp (reply/tag) | .getdp inbox | .getdp chat',
  
  async execute(sock, msg, args, extra) {
    try {
      const senderJid = extra.sender || msg.key.participant || msg.key.remoteJid;

      // ==========================================
      // ⚙️ SETTINGS CONFIGURATION (Inbox vs Chat)
      // ==========================================
      if (args.length > 0) {
        const option = args[0].toLowerCase();
        
        if (option === 'inbox') {
          const settings = loadSettings();
          settings[senderJid] = 'inbox';
          saveSettings(settings);
          
          let inboxText = `❖ ── ✦ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ✦ ── ❖\n\n`;
          inboxText += `🎯 *Mode:* INBOX\n`;
          inboxText += `✅ *Status:* Successfully Updated\n`;
          inboxText += `💡 *Info:* Profile pictures will now be delivered directly to your private messages.\n`;
          inboxText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          
          return extra.reply(inboxText);
        } 
        else if (option === 'chat') {
          const settings = loadSettings();
          settings[senderJid] = 'chat';
          saveSettings(settings);
          
          let chatText = `❖ ── ✦ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ✦ ── ❖\n\n`;
          chatText += `🎯 *Mode:* CHAT\n`;
          chatText += `✅ *Status:* Successfully Updated\n`;
          chatText += `💡 *Info:* Profile pictures will now be sent here in the group chat.\n`;
          chatText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          
          return extra.reply(chatText);
        }
      }

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
        // Agar khali command likhi hai, toh Group/Chat ki DP nikalo
        targetUser = extra.from;
      }
      
      if (!targetUser) {
        let errText = `❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n`;
        errText += `❌ Could not identify the target.\n`;
        errText += `💡 *Tip:* Reply to a message or tag someone.\n`;
        errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(errText);
      }

      isGroupTarget = targetUser.endsWith('@g.us');
      
      try {
        // Try to get the profile picture in High Resolution ('image')
        const ppUrl = await sock.profilePictureUrl(targetUser, 'image');
        
        if (!ppUrl) {
          let notFoundText = `❖ ── ✦ 𝐀𝐕𝐀𝐓𝐀𝐑 ✦ ── ❖\n\n`;
          notFoundText += `❌ Profile picture not found.\n`;
          notFoundText += `🔒 *Reason:* It might be deleted or set to private.\n`;
          notFoundText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          return extra.reply(notFoundText);
        }
        
        // Download the profile picture
        const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Premium Caption Logic
        let captionText = '';
        let mentionsInfo = [];

        if (isGroupTarget) {
          captionText = `❖ ── ✦ 𝐆𝐑𝐎𝐔𝐏 𝐈𝐂𝐎𝐍 ✦ ── ❖\n\n📸 *Target:* Group Avatar\n╰━━━━━━━━━━━━━━━━━━`;
        } else {
          captionText = `❖ ── ✦ 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐏𝐈𝐂 ✦ ── ❖\n\n👤 *User:* @${targetUser.split('@')[0]}\n╰━━━━━━━━━━━━━━━━━━`;
          mentionsInfo = [targetUser];
        }

        // ==========================================
        // 🚀 DELIVERY LOGIC (Send to Inbox or Chat)
        // ==========================================
        const settings = loadSettings();
        const deliveryMode = settings[senderJid] || 'inbox'; // Default is always Inbox
        
        const destination = deliveryMode === 'chat' ? extra.from : senderJid;

        const sendOptions = { 
          image: buffer,
          caption: captionText,
          mentions: mentionsInfo
        };

        // Agar chat mein bhejna hai toh normal reply
        if (destination === extra.from) {
          await sock.sendMessage(destination, sendOptions, { quoted: msg });
        } else {
          // Agar Inbox mein bhejna hai toh direct send
          await sock.sendMessage(destination, sendOptions);
          
          // 🔥 Automatically delete the command message from the chat
          try {
            await sock.sendMessage(extra.from, { delete: msg.key });
          } catch (delErr) {
            // Silently ignore if bot lacks admin rights to delete the message
          }
        }

      } catch (profileError) {
        // Handle all profile errors silently and cleanly
        let privateText = `❖ ── ✦ 𝐀𝐕𝐀𝐓𝐀𝐑 ✦ ── ❖\n\n`;
        privateText += `❌ Profile picture not found.\n`;
        privateText += `🔒 *Reason:* It might be deleted or set to private.\n`;
        privateText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return extra.reply(privateText);
      }
      
    } catch (error) {
      console.error(error);
      let failText = `❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n`;
      failText += `❌ An unexpected error occurred while fetching the picture.\n`;
      failText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      extra.reply(failText);
    }
  }
};

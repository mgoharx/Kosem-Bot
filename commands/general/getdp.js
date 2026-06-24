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

      // Load user delivery preference
      const settings = loadSettings();
      let deliveryMode = settings[senderJid] || 'inbox'; // Default is always Inbox

      // ==========================================
      // ⚙️ SETTINGS CONFIGURATION (Inbox vs Chat)
      // ==========================================
      if (args.length > 0) {
        const option = args[0].toLowerCase();
        
        if (option === 'inbox') {
          settings[senderJid] = 'inbox';
          saveSettings(settings);
          
          // 🔥 Mode 'Inbox' hua hai toh command foran delete kar do
          try { await sock.sendMessage(extra.from, { delete: msg.key }); } catch (e) {}
          
          let inboxText = `❖ ──── ✦ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ✦ ──── ❖\n\n` +
                          `🎯 *Mode:* Inbox\n` +
                          `✅ *Status:* Successfully Updated\n` +
                          `💡 *Info:* Profile pictures & all errors will now be sent to your inbox.\n` +
                          `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          // Command delete ho chuki hai, isliye without quote send karega
          return await sock.sendMessage(extra.from, { text: inboxText });
        } 
        else if (option === 'chat') {
          settings[senderJid] = 'chat';
          saveSettings(settings);
          
          let chatText = `❖ ──── ✦ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ✦ ──── ❖\n\n` +
                         `🎯 *Mode:* Chat\n` +
                         `✅ *Status:* Successfully Updated\n` +
                         `💡 *Info:* Profile pictures will now be sent here in the chat.\n` +
                         `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          // Mode 'Chat' hai, isliye command delete NAHI hogi aur normal reply aayega
          return extra.reply(chatText);
        }
      }

      const isInbox = (deliveryMode === 'inbox');

      // =========================================================
      // 🧹 CONDITIONAL COMMAND DELETE (Sirf Inbox Mode mein delete)
      // =========================================================
      if (isInbox) {
        try {
          await sock.sendMessage(extra.from, { delete: msg.key });
        } catch (e) {
          // Silently ignore if bot lacks permissions
        }
      }

      // =========================================================
      // 🚀 MASTER DISPATCHER (Sari cheezein yahan se route hongi)
      // =========================================================
      const sendSmart = async (contentObj) => {
        if (isInbox) {
          // 📩 INBOX MODE: Seedha Inbox fenko
          return await sock.sendMessage(senderJid, contentObj);
        } else {
          // 💬 CHAT MODE: Normal public chat reply (Quote ke sath kyunki command delete nahi hui)
          return await sock.sendMessage(extra.from, contentObj, { quoted: msg });
        }
      };

      // Target pakro
      let targetUser = null;
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

      if (quotedMessage) {
        targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      } else if (mentionedJid && mentionedJid.length > 0) {
        targetUser = mentionedJid[0];
      } else {
        targetUser = extra.from;
      }
      
      if (!targetUser) {
        let errText = `❖ ─── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ─── ❖\n\n` +
                      `❌ Could not identify the target.\n` +
                      `💡 *Tip:* Reply to a message or tag someone.\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return await sendSmart({ text: errText });
      }

      const isGroupTarget = targetUser.endsWith('@g.us');
      
      try {
        const ppUrl = await sock.profilePictureUrl(targetUser, 'image');
        
        if (!ppUrl) {
          let notFoundText = `❖ ─── ✦ 𝐀𝐕𝐀𝐓𝐀𝐑 ✦ ─── ❖\n\n` +
                             `❌ Profile picture not found.\n` +
                             `🔒 *Reason:* It might be deleted or set to private.\n` +
                             `╰━━━━━━━━━━━━━━━━━━┈⊷`;
          return await sendSmart({ text: notFoundText });
        }
        
        const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        let captionText = '';
        let mentionsInfo = [];

        if (isGroupTarget) {
          captionText = `❖ ── ✦ 𝐆𝐑𝐎𝐔𝐏 𝐈𝐂𝐎𝐍 ✦ ── ❖\n\n📸 *Target:* Group Avatar\n╰━━━━━━━━━━━━━━━━┈⊷`;
        } else {
          captionText = `❖ ── ✦ 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐏𝐈𝐂 ✦ ── ❖\n\n👤 *User:* @${targetUser.split('@')[0]}\n╰━━━━━━━━━━━━━━━━┈⊷`;
          mentionsInfo = [targetUser];
        }

        // DP Send to funnel
        await sendSmart({ 
          image: buffer,
          caption: captionText,
          mentions: mentionsInfo
        });

      } catch (profileError) {
        // Privacy / DP not set errors go to funnel
        let privateText = `❖ ─── ✦ 𝐀𝐕𝐀𝐓𝐀𝐑 ✦ ─── ❖\n\n` +
                          `❌ Profile picture not found.\n` +
                          `🔒 *Reason:* It might be deleted, hidden or no DP set.\n` +
                          `╰━━━━━━━━━━━━━━━━━━┈⊷`;
        return await sendSmart({ text: privateText });
      }
      
    } catch (error) {
      console.error(error);
      let failText = `❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n` +
                     `❌ An unexpected error occurred while fetching the picture.\n` +
                     `╰━━━━━━━━━━━━━━━━━━┈⊷`;
      
      // Failsafe agar dispatcher fail ho jaye
      try {
        const settings = loadSettings();
        const mode = settings[extra.sender || msg.key.remoteJid] || 'inbox';
        if (mode === 'inbox') {
          sock.sendMessage(extra.sender || msg.key.remoteJid, { text: failText }).catch(()=>{});
        } else {
          // Chat mode error mein properly quote ke sath reply karega
          sock.sendMessage(extra.from, { text: failText }, { quoted: msg }).catch(()=>{});
        }
      } catch (e) {}
    }
  }
};

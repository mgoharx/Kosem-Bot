/**
 * WhatsApp MD Bot - Main Entry Point
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

// 🚀 GLOBAL VARIABLES (For Boot & Presence Control)
if (typeof global.isAlwaysOnline === 'undefined') {
    global.isAlwaysOnline = false; // Default is strictly OFFLINE
}
global.isBotReady = false; // System lock until 100% processed

// ==========================================
// 🔇 ULTIMATE NOISE SUPPRESSOR (Advanced)
// ==========================================
const util = require('util');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const noisyLogs = [
    'Bad MAC', 'Failed to decrypt', 'Session error', 
    'Closing open session', 'prekey bundle', 'SessionEntry', 
    '_chains', 'registrationId', 'currentRatchet', 'indexInfo',
    'ephemeralKeyPair', 'rootKey', 'baseKey'
];

console.log = (...args) => {
  const logStr = args.map(a => typeof a === 'string' ? a : util.inspect(a)).join(' ');
  if (noisyLogs.some(noise => logStr.includes(noise))) return;
  originalConsoleLog.apply(console, args);
};
console.error = (...args) => {
  const logStr = args.map(a => typeof a === 'string' ? a : util.inspect(a)).join(' ');
  if (noisyLogs.some(noise => logStr.includes(noise))) return;
  originalConsoleError.apply(console, args);
};
console.warn = (...args) => {
  const logStr = args.map(a => typeof a === 'string' ? a : util.inspect(a)).join(' ');
  if (noisyLogs.some(noise => logStr.includes(noise))) return;
  originalConsoleWarn.apply(console, args);
};
// ==========================================

const { initializeTempSystem } = require('./utils/tempManager');
const { startCleanup } = require('./utils/cleanup');
initializeTempSystem();
startCleanup();

const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const handler = require('./handler');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');

function cleanupPuppeteerCache() {
  try {
    const home = os.homedir();
    const cacheDir = path.join(home, '.cache', 'puppeteer');
    if (fs.existsSync(cacheDir)) {
      console.log('🧹 Removing Puppeteer cache...');
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  } catch (err) {}
}

const store = {
  messages: new Map(),
  maxPerChat: 500,
  bind: (ev) => {
    ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return; 
      for (const msg of messages) {
        if (!msg.key?.id) continue;
        
        const jid = msg.key.remoteJid;
        if (!store.messages.has(jid)) {
          store.messages.set(jid, new Map());
        }
        const chatMsgs = store.messages.get(jid);
        chatMsgs.set(msg.key.id, msg);
        if (chatMsgs.size > store.maxPerChat) {
          const oldestKey = chatMsgs.keys().next().value;
          chatMsgs.delete(oldestKey);
        }
      }
    });
  },
  loadMessage: async (jid, id) => {
    return store.messages.get(jid)?.get(id) || null;
  }
};

const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 5 * 60 * 1000); 

// 🚀 SEND VIP BOOT MESSAGE FUNCTION
async function sendPremiumBootMessage(sock) {
    try {
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'; 
        const botName = config.botName || 'Kosem Bot';
        const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
        
        const bootText = `❖ ── ✦ 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐄 ✦ ── ❖\n\n` +
                         `✨ *${botName} is successfully connected and Online!*\n\n` +
                         `👑 *Owner:* ${ownerNames}\n` +
                         `🟢 *Status:* Active\n\n` +
                         `📝 *Description:* This is an advanced WhatsApp bot made by Muhammad Gohar.\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(myJid, {
          text: bootText,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363427491383372@newsletter', 
              newsletterName: `✨ ${botName} Official`,
              serverMessageId: -1
            }
          }
        });
        console.log('📩 Premium Boot message sent to inbox!');
    } catch (err) {}
}

async function startBot() {
  const sessionFolder = `./${config.sessionName}`;
  const sessionFile = path.join(sessionFolder, 'creds.json');
  const botSessionID = process.env.SESSION_ID || config.sessionID;

  if (botSessionID && botSessionID.startsWith('Kosem!') && !fs.existsSync(sessionFile)) {
    try {
      console.log("📥 Downloading Session ID...");
      const [header, b64data] = botSessionID.split('!');
      if (header === 'Kosem' && b64data) {
        const cleanB64 = b64data.replace('...', '');
        const compressedData = Buffer.from(cleanB64, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);
        if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(sessionFile, decompressedData, 'utf8');
        console.log('✅ Session ID successfully loaded!');
      }
    } catch (e) { console.error('❌ Error processing Kosem session:', e.message); }
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();
  const silentLogger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger: silentLogger,
    printQRInTerminal: false,
    browser: ['Chrome', 'Windows', '10.0'],
    auth: state,
    syncFullHistory: false,
    downloadHistory: false,
    markOnlineOnConnect: false, 
    getMessage: async () => undefined
  });

  store.bind(sock.ev);

  let lastActivity = Date.now();
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; 
  sock.ev.on('messages.upsert', () => { lastActivity = Date.now(); });

  const watchdogInterval = setInterval(async () => {
    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && sock.ws?.readyState === 1) {
      console.log('⚠️ No activity detected. Reconnecting to keep alive...');
      await sock.end(undefined, undefined, { reason: 'inactive' });
      clearInterval(watchdogInterval);
    }
  }, 5 * 60 * 1000);

  // 🚀 THE ULTIMATE PRESENCE ENFORCER (Runs in background smoothly)
  setInterval(async () => {
    if (!global.isBotReady || !sock) return;
    try {
        await sock.sendPresenceUpdate(global.isAlwaysOnline ? 'available' : 'unavailable');
    } catch(e) {}
  }, 30000);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      global.isBotReady = false; // Lock bot on disconnect
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || String(lastDisconnect?.error) || 'Unknown error';
      let shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === 409 || errorMessage.toLowerCase().includes('conflict')) {
        console.log('\n🚨 CRITICAL: Stream Conflict Detected (409)! Killing ghost process to clear database...');
        process.exit(1); 
      } else {
        if (shouldReconnect) setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {
      console.log('\n✅ Connection established!');
      console.log(`📱 Bot Number: ${sock.user.id.split(':')[0]}`);
      
      if (config.autoBio) await sock.updateProfileStatus(`${config.botName} | Active 24/7`);
      handler.initializeAntiCall(sock);
      await sock.sendPresenceUpdate('unavailable'); // Force offline instantly

      // ==========================================
      // 🚀 PROCESSING BAR & QUEUE DRAINER
      // ==========================================
      console.log('\n🔄 Clearing backlog and setting up system...');
      let progress = 0;
      
      const bootInterval = setInterval(() => {
        progress += 10;
        const filled = Math.floor(progress / 10);
        const empty = 10 - filled;
        process.stdout.write(`\r⏳ Processing: [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progress}%`);
        
        if (progress >= 100) {
          clearInterval(bootInterval);
          process.stdout.write('\n'); 
          console.log('🚀 System is 100% READY and Active!\n');
          
          global.isBotReady = true; // Unlock the bot for commands
          sendPremiumBootMessage(sock); 
        }
      }, 1000); // 10 second shield
      // ==========================================
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const isSystemJid = (jid) => {
    if (!jid) return true;
    return jid.includes('@broadcast') || jid.includes('status.broadcast') || jid.includes('@newsletter') || jid.includes('@newsletter.');
  };

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    // 🚀 SYSTEM LOCK: Drop all messages until progress bar is 100%
    if (!global.isBotReady) return; 

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;
      
      // 🚀 THE MAGIC FIX FOR THE DELAY!
      // Agar message 5 minute (300 seconds) se purana hai, tabhi ignore hoga. 
      // Server Time Glitch is se 100% fix ho jayega aur current commands miss nahi hongi!
      const msgTime = msg.messageTimestamp || 0;
      const currentTime = Math.floor(Date.now() / 1000);
      if (msgTime > 0 && (currentTime - msgTime) > 300) {
          continue; 
      }

      const from = msg.key.remoteJid;
      if (!from) continue;

      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;
      processedMessages.add(msgId);

      if (!isSystemJid(from)) {
        handler.handleMessage(sock, msg).catch(err => {
            console.error('Command Error:', err.message);
        });

        setImmediate(async () => {
          if (config.autoRead && from.endsWith('@g.us')) {
            try { await sock.readMessages([msg.key]); } catch (e) { }
          }
          try { if (handler.autoSniffViewOnce) await handler.autoSniffViewOnce(sock, msg); } catch (err) { }
          if (from.endsWith('@g.us')) {
            try {
              const groupMetadata = await handler.getGroupMetadata(sock, from);
              if (groupMetadata) await handler.handleAntilink(sock, msg, groupMetadata);
            } catch (error) { }
          }
        });
      }
    }
  });

  sock.ev.on('message-receipt.update', () => { });

  // ==========================================
  // 🔴 ANTI-DELETE & ANTI-STATUS SYSTEM
  // ==========================================
  sock.ev.on('messages.update', async (chatUpdate) => {
    if (!global.isBotReady) return; // Prevent anti-delete lag during boot

    for (const { key, update } of chatUpdate) {
      let isDeletedMessage = false;
      if (update.message === null) isDeletedMessage = true;
      else if (update.message?.protocolMessage && (update.message.protocolMessage.type === 0 || update.message.protocolMessage.type === 'REVOKE')) {
          isDeletedMessage = true;
      }

      if (isDeletedMessage) {
        try {
          const deletedMsg = await store.loadMessage(key.remoteJid, key.id);
          if (!deletedMsg) return;

          const from = key.remoteJid;
          const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

          let rawSender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
          if (!rawSender) return;
          const cleanSender = rawSender.includes(':') ? rawSender.split(':')[0] + '@s.whatsapp.net' : rawSender;
          const senderNumber = cleanSender.split('@')[0];

          let msgObj = deletedMsg.message;
          if (!msgObj) return;

          if (msgObj.ephemeralMessage) msgObj = msgObj.ephemeralMessage.message;
          if (msgObj.viewOnceMessage) msgObj = msgObj.viewOnceMessage.message;
          if (msgObj.viewOnceMessageV2) msgObj = msgObj.viewOnceMessageV2.message;
          if (msgObj.viewOnceMessageV2Extension) msgObj = msgObj.viewOnceMessageV2Extension.message;
          if (msgObj.documentWithCaptionMessage) msgObj = msgObj.documentWithCaptionMessage.message;

          const mtype = Object.keys(msgObj || {})[0];
          if (!mtype) return;

          const isGroup = from.endsWith('@g.us');
          const isStatus = from === 'status@broadcast';
          let chatName = '';

          if (isGroup) {
            try {
              const groupMeta = await sock.groupMetadata(from);
              chatName = groupMeta.subject; 
            } catch (e) { chatName = "Group"; }
          } else if (isStatus) { chatName = "WhatsApp Status"; } 
          else { chatName = "Private Chat"; }

          const time = new Date().toLocaleTimeString('en-US', { 
              timeZone: 'Asia/Karachi', hour: 'numeric', minute: 'numeric', hour12: true 
          });

          let mediaType = "";
          if (msgObj.imageMessage) mediaType = isStatus ? "Status Photo" : "Photo";
          else if (msgObj.videoMessage || msgObj.ptvMessage) mediaType = isStatus ? "Status Video" : "Video";
          else if (msgObj.audioMessage) mediaType = msgObj.audioMessage.ptt ? "Voice Recording" : "Audio File";
          else if (msgObj.documentMessage) mediaType = "Document";
          else if (msgObj.stickerMessage) mediaType = "Sticker";
          else if (msgObj.contactMessage || msgObj.contactsArrayMessage) mediaType = "Contact";
          else if (msgObj.locationMessage || msgObj.liveLocationMessage) mediaType = "Location";
          else mediaType = isStatus ? "Text Status" : "Text Message";

          const originalText = msgObj.conversation || 
                               msgObj.extendedTextMessage?.text || 
                               msgObj.imageMessage?.caption || 
                               msgObj.videoMessage?.caption || 
                               msgObj.documentMessage?.fileName || 
                               msgObj.documentMessage?.caption || "";

          const pushName = deletedMsg.pushName || "Unknown User";
          let caption = `❖ ── ✦ 𝐀𝐍𝐓𝐈 𝐃𝐄𝐋𝐄𝐓𝐄 ✦ ── ❖\n\n👤 *Sender:* @${senderNumber}\n📍 *Chat:* ${chatName} (${pushName})\n🕰️ *Time:* ${time}\n📦 *Deleted:* ${mediaType}\n`;

          if (originalText) {
              caption += `\n❖ ── ✦ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ✦ ── ❖\n💬 ${originalText}`;
          } else if (mediaType === "Text Message" || mediaType === "Text Status") {
              caption += `\n❖ ── ✦ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ✦ ── ❖\n💬 [Message deleted]`;
          }

          if (msgObj.imageMessage || msgObj.videoMessage) {
              if (msgObj.imageMessage) {
                  msgObj.imageMessage.caption = caption;
                  msgObj.imageMessage.contextInfo = { ...(msgObj.imageMessage.contextInfo || {}), mentionedJid: [cleanSender] };
              }
              if (msgObj.videoMessage) {
                  msgObj.videoMessage.caption = caption;
                  msgObj.videoMessage.contextInfo = { ...(msgObj.videoMessage.contextInfo || {}), mentionedJid: [cleanSender] };
              }
              await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
          } else {
              await sock.sendMessage(myJid, { text: caption, mentions: [cleanSender] }).catch(()=>{});
              const hasMedia = msgObj.audioMessage || msgObj.stickerMessage || msgObj.documentMessage || msgObj.contactMessage || msgObj.locationMessage;
              if (hasMedia) await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
          }
        } catch (err) {} 
      }
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
    if (!global.isBotReady) return;
    try { await handler.handleGroupUpdate(sock, update); } catch(e){}
  });

  return sock;
}

console.log('🚀 Starting Kosem Bot...\n');
cleanupPuppeteerCache();
startBot();

process.on('uncaughtException', (err) => {
    if (err.code === 'ENOSPC' || err.message?.includes('no space left')) {
        console.error('⚠️ Storage full. Cleaning up...');
        require('./utils/cleanup').cleanupOldFiles();
        return; 
    }
});

process.on('unhandledRejection', (err) => {});

module.exports = { store };

/**
 * WhatsApp MD Bot - Main Entry Point
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

// 🚀 DEFAULT OFFLINE STATE (Bot will never show online on boot)
if (typeof global.isAlwaysOnline === 'undefined') {
    global.isAlwaysOnline = false;
}

// ==========================================
// 🔇 ULTIMATE NOISE SUPPRESSOR (Hides WhatsApp Crypto Spam)
// ==========================================
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
  const logStr = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
  if (noisyLogs.some(noise => logStr.includes(noise))) return;
  originalConsoleLog.apply(console, args);
};
console.error = (...args) => {
  const logStr = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
  if (noisyLogs.some(noise => logStr.includes(noise))) return;
  originalConsoleError.apply(console, args);
};
console.warn = (...args) => {
  const logStr = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
  if (noisyLogs.some(noise => logStr.includes(noise))) return;
  originalConsoleWarn.apply(console, args);
};
// ==========================================

// ⏱️ BOT UPTIME TRACKER (For Anti-Spam Fix)
const BOT_START_TIME = Date.now();

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
        
        if (msg.messageTimestamp && (msg.messageTimestamp * 1000) < BOT_START_TIME) continue;

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
    } catch (e) {
      console.error('❌ Error processing Kosem session:', e.message);
    }
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
    markOnlineOnConnect: false, // Prevents online status on connect
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

  sock.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'open') lastActivity = Date.now();
    else if (connection === 'close') clearInterval(watchdogInterval);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || String(lastDisconnect?.error) || 'Unknown error';
      let shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === 409 || errorMessage.toLowerCase().includes('conflict')) {
        console.log('\n🚨 CRITICAL: Stream Conflict Detected (409)!');
        process.exit(1); 
      } else {
        if (shouldReconnect) setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {
      console.log('\n✅ Bot connected successfully!');
      console.log(`📱 Bot Number: ${sock.user.id.split(':')[0]}`);
      
      if (config.autoBio) await sock.updateProfileStatus(`${config.botName} | Active 24/7`);
      handler.initializeAntiCall(sock);

      try {
        await sock.sendPresenceUpdate('unavailable'); // Force offline on boot
        
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'; 
        const botName = config.botName || 'Kosem Bot';
        const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
        
        const bootText = `❖ ── ✦ 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐄 ✦ ── ❖\n\n` +
                         `✨ *${botName} is successfully connected and Online!*\n\n` +
                         `👑 *Owner:* ${ownerNames}\n` +
                         `🟢 *Status:* Active\n\n` +
                         `📝 *Description:* This is an advanced WhatsApp bot made by Muhammad Gohar.\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━━━`;

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
      } catch (err) {}

      const now = Date.now();
      for (const [jid, chatMsgs] of store.messages.entries()) {
        const timestamps = Array.from(chatMsgs.values()).map(m => m.messageTimestamp * 1000 || 0);
        if (timestamps.length > 0 && now - Math.max(...timestamps) > 24 * 60 * 60 * 1000) {
          store.messages.delete(jid);
        }
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const isSystemJid = (jid) => {
    if (!jid) return true;
    return jid.includes('@broadcast') || jid.includes('status.broadcast') || jid.includes('@newsletter') || jid.includes('@newsletter.');
  };

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    // 🚀 THE ULTIMATE PRESENCE FIX: Har message par strict rule apply karega!
    try {
        if (global.isAlwaysOnline) {
            await sock.sendPresenceUpdate('available');
        } else {
            await sock.sendPresenceUpdate('unavailable');
        }
    } catch(e) {}

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;

      // 🚀 THE QUICK START FIX: Ignore all backlog messages instantly!
      if (msg.messageTimestamp && (msg.messageTimestamp * 1000) < BOT_START_TIME) {
          continue; 
      }

      const from = msg.key.remoteJid;
      if (!from) continue;

      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;
      processedMessages.add(msgId);

      if (!isSystemJid(from)) {
        handler.handleMessage(sock, msg).catch(err => {
          if (!err.message?.includes('rate-overlimit')) console.error('Error handling message:', err.message);
        });

        setImmediate(async () => {
          if (config.autoRead && from.endsWith('@g.us')) {
            try { await sock.readMessages([msg.key]); } catch (e) { }
          }
          try {
            if (handler.autoSniffViewOnce) await handler.autoSniffViewOnce(sock, msg);
          } catch (err) { }

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
    for (const { key, update } of chatUpdate) {
      
      let isDeletedMessage = false;
      if (update.message === null) isDeletedMessage = true;
      else if (update.message?.protocolMessage && (update.message.protocolMessage.type === 0 || update.message.protocolMessage.type === 'REVOKE')) {
          isDeletedMessage = true;
      }

      if (isDeletedMessage) {
        try {
          const deletedMsg = await store.loadMessage(key.remoteJid, key.id);
          if (!deletedMsg || (deletedMsg.messageTimestamp * 1000) < BOT_START_TIME) return;

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
          } else if (isStatus) {
            chatName = "WhatsApp Status";
          } else {
            chatName = "Private Chat"; 
          }

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
                  msgObj.imageMessage.contextInfo = { 
                      ...(msgObj.imageMessage.contextInfo || {}), 
                      mentionedJid: [cleanSender] 
                  };
              }
              if (msgObj.videoMessage) {
                  msgObj.videoMessage.caption = caption;
                  msgObj.videoMessage.contextInfo = { 
                      ...(msgObj.videoMessage.contextInfo || {}), 
                      mentionedJid: [cleanSender] 
                  };
              }
              await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
          } else {
              await sock.sendMessage(myJid, { text: caption, mentions: [cleanSender] }).catch(()=>{});
              const hasMedia = msgObj.audioMessage || msgObj.stickerMessage || msgObj.documentMessage || msgObj.contactMessage || msgObj.locationMessage;
              if (hasMedia) {
                await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
              }
          }
        } catch (err) {} 
      }
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
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

process.on('unhandledRejection', (err) => {
    if (err.message && err.message.includes('rate-overlimit')) return;
});

module.exports = { store };

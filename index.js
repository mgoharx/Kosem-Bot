/**
 * WhatsApp MD Bot - Main Entry Point (TRUE GHOST MODE)
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

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
      console.log('[⚙️] System: Removing Puppeteer cache...');
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
      console.log("[📥] Auth: Downloading Session ID data...");
      const [header, b64data] = botSessionID.split('!');

      if (header === 'Kosem' && b64data) {
        const cleanB64 = b64data.replace('...', '');
        const compressedData = Buffer.from(cleanB64, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);
        if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(sessionFile, decompressedData, 'utf8');
        console.log('[✅] Auth: Session ID successfully loaded!');
      }
    } catch (e) {
      console.error('[❌] Error: Failed to process Kosem session ->', e.message);
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
    markOnlineOnConnect: false,
    getMessage: async () => undefined
  });

  store.bind(sock.ev);

  let lastActivity = Date.now();
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; 

  sock.ev.on('messages.upsert', () => { lastActivity = Date.now(); });

  const watchdogInterval = setInterval(async () => {
    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && sock.ws?.readyState === 1) {
      console.log('[⚠️] System: No activity detected. Reconnecting to maintain uptime...');
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

    if (qr) {
        console.log('\n[📱] Scan this QR code with WhatsApp:\n');
        qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || String(lastDisconnect?.error) || 'Unknown error';
      let shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === 409 || errorMessage.toLowerCase().includes('conflict')) {
        console.log('\n[🚨] CRITICAL ERROR: Stream Conflict Detected (409)!');
        console.log('[💀] System: Multiple instances fighting for connection. Terminating ghost process...\n');
        process.exit(1); 
      } else {
        if (statusCode === 515 || statusCode === 503 || statusCode === 408) {
          console.log(`[⚠️] Network: Connection closed (Code: ${statusCode}). Reconnecting...`);
        } else {
          console.log(`[⚠️] Network: Connection closed (${errorMessage}). Reconnecting: ${shouldReconnect}`);
        }
        if (shouldReconnect) setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {

      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(', ') : config.ownerName;
      
      console.log('\n[✅] CONNECTION ESTABLISHED SUCCESSFULLY');
      console.log(`[📱] Number : +${sock.user.id.split(':')[0]}`);
      console.log(`[🤖] Bot    : ${config.botName}`);
      console.log(`[⚡] Prefix : ${config.prefix}`);
      console.log(`[👑] Owner  : ${ownerNames}`);
      console.log('[💬] System: Bot is fully online and ready to receive messages!\n');

      if (config.autoBio) await sock.updateProfileStatus(`${config.botName} | Active 24/7`);
      handler.initializeAntiCall(sock);

      // ==========================================
      // 🚀 THE GHOST MODE LOCK (Run exactly ONCE on start)
      // ==========================================
      await sock.sendPresenceUpdate('unavailable');

      try {
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botName = config.botName || 'Kosem Bot';
        
        const bootText = `❖ ─── ✦ 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐄 ✦ ─── ❖\n\n` +
                         `✨ *${botName} is successfully connected and Online!*\n\n` +
                         `👑 *Owner:* ${ownerNames}\n` +
                         `🟢 *Status:* Active (Ghost Mode)\n\n` +
                         `📝 *Description:* This is an advanced WhatsApp bot made by Muhammad Gohar.\n` +
                         `╰━━━━━━━━━━━━━━━━━━┈⊷`;

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
        console.log('[📩] Status: Premium Boot message sent to inbox!');
      } catch (err) {
        console.log('[⚠️] Warning: Failed to send boot message.', err);
      }

      const now = Date.now();
      for (const [jid, chatMsgs] of store.messages.entries()) {
        const timestamps = Array.from(chatMsgs.values()).map(m => m.messageTimestamp * 1000 || 0);
        if (timestamps.length > 0 && now - Math.max(...timestamps) > 24 * 60 * 60 * 1000) {
          store.messages.delete(jid);
        }
      }
      console.log(`[🧹] Memory: Store optimized. Active chats: ${store.messages.size}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const isSystemJid = (jid) => {
    if (!jid) return true;
    return jid.includes('@broadcast') || jid.includes('status.broadcast') || jid.includes('@newsletter') || jid.includes('@newsletter.');
  };

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;

      const from = msg.key.remoteJid;
      if (!from) continue;

      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;
      processedMessages.add(msgId);

      if (!isSystemJid(from)) {
        handler.handleMessage(sock, msg).catch(err => {
          if (!err.message?.includes('rate-overlimit')) console.error('[❌] Error: Message handle failed ->', err.message);
        });

        setImmediate(async () => {
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
  // 🔴 ANTI-DELETE & ANTI-STATUS SYSTEM (TOGGLEABLE)
  // ==========================================
  sock.ev.on('messages.update', async (chatUpdate) => {
    
    // 🛑 DYNAMIC MASTER SWITCH: Check if Anti-Delete is ON or OFF
    const antidelPath = path.join(process.cwd(), 'antidel_state.json');
    let isAntiDeleteOn = true; // Default ON
    if (fs.existsSync(antidelPath)) {
      try { isAntiDeleteOn = JSON.parse(fs.readFileSync(antidelPath)).status; } catch(e){}
    }
    
    // Agar command ke zariye OFF kiya gaya hai, toh processing yahin rok dein
    if (!isAntiDeleteOn) return; 

    for (const { key, update } of chatUpdate) {
      
      // 🚫 GHOST MODE FIX: Status Expiration Ignored!
      if (key.remoteJid === 'status@broadcast') continue;

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
          let chatName = '';

          if (isGroup) {
            try {
              const groupMeta = await sock.groupMetadata(from);
              chatName = groupMeta.subject; 
            } catch (e) { chatName = "Group"; }
          } else {
            chatName = "Private Chat"; 
          }

          const time = new Date().toLocaleTimeString('en-US', { 
              timeZone: 'Asia/Karachi', hour: 'numeric', minute: 'numeric', hour12: true 
          });

          let mediaType = "";
          if (msgObj.imageMessage) mediaType = "Photo";
          else if (msgObj.videoMessage || msgObj.ptvMessage) mediaType = "Video";
          else if (msgObj.audioMessage) mediaType = msgObj.audioMessage.ptt ? "Voice Recording" : "Audio File";
          else if (msgObj.documentMessage) mediaType = "Document";
          else if (msgObj.stickerMessage) mediaType = "Sticker";
          else if (msgObj.contactMessage || msgObj.contactsArrayMessage) mediaType = "Contact";
          else if (msgObj.locationMessage || msgObj.liveLocationMessage) mediaType = "Location";
          else mediaType = "Text Message";

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
          } else if (mediaType === "Text Message") {
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

console.log('\n[🚀] System: STARTING KOSEM BOT...\n');

cleanupPuppeteerCache();
startBot();

process.on('uncaughtException', (err) => {
    if (err.code === 'ENOSPC' || err.message?.includes('no space left')) {
        console.error('[⚠️] System: Storage full. Triggering emergency cleanup...');
        require('./utils/cleanup').cleanupOldFiles();
        return; 
    }
});

process.on('unhandledRejection', (err) => {
    if (err.message && err.message.includes('rate-overlimit')) return;
});

module.exports = { store };

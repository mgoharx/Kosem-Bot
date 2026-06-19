/**
 * WhatsApp MD Bot - Main Entry Point
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

// ⏱️ BOT UPTIME TRACKER (For Anti-Spam Fix)
const BOT_START_TIME = Date.now();

const { initializeTempSystem } = require('./utils/tempManager');
const { startCleanup } = require('./utils/cleanup');
initializeTempSystem();
startCleanup();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// 🔇 SUPER STRICT LOG SUPPRESSION
const forbiddenPatternsConsole = [
  'closing session', 'closing open session', 'sessionentry',
  'prekey bundle', 'pendingprekey', '_chains', 'registrationid',
  'currentratchet', 'chainkey', 'ratchet', 'signal protocol',
  'ephemeralkeypair', 'indexinfo', 'basekey', 'lastremoteephemeralkey',
  'rootkey', 'previouscounter', 'basekeytype', 'remoteidentitykey',
  'signedkeyid', 'prekeyid', 'pubkey', 'privkey'
];

const checkAndSuppress = (args, originalMethod) => {
  const message = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ').toLowerCase();
  if (!forbiddenPatternsConsole.some(pattern => message.includes(pattern))) {
    originalMethod.apply(console, args);
  }
};

console.log = (...args) => checkAndSuppress(args, originalConsoleLog);
console.error = (...args) => checkAndSuppress(args, originalConsoleError);
console.warn = (...args) => checkAndSuppress(args, originalConsoleWarn);

// Now safe to load libraries
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const handler = require('./handler');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');

// Remove Puppeteer cache
function cleanupPuppeteerCache() {
  try {
    const home = os.homedir();
    const cacheDir = path.join(home, '.cache', 'puppeteer');

    if (fs.existsSync(cacheDir)) {
      console.log('🧹 Removing Puppeteer cache at:', cacheDir);
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ Puppeteer cache removed');
    }
  } catch (err) {
    console.error('⚠️ Failed to cleanup Puppeteer cache:', err.message || err);
  }
}

// Optimized in-memory store
const store = {
  messages: new Map(),
  maxPerChat: 500, // 🛠️ INCREASED TO 500 SO ANTI-DELETE WORKS PROPERLY

  bind: (ev) => {
    ev.on('messages.upsert', ({ messages }) => {
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

setInterval(() => {
  processedMessages.clear();
}, 5 * 60 * 1000); 

const createSuppressedLogger = (level = 'silent') => {
  let logger;
  try {
    logger = pino({
      level,
      transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, ignore: 'pid,hostname' }
      },
      customLevels: { trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5 }
    });
  } catch (err) {
    logger = pino({ level });
  }

  const originalInfo = logger.info.bind(logger);
  logger.info = (...args) => checkAndSuppress(args, originalInfo);
  logger.debug = () => { };
  logger.trace = () => { };
  return logger;
};

// Global variables to fix reconnect loop
let reconnectCount = 0;
let isStarting = false;

// Main connection function
async function startBot() {
  if (isStarting) return;
  isStarting = true;

  const sessionFolder = `./${config.sessionName}`;
  const sessionFile = path.join(sessionFolder, 'creds.json');
  const botSessionID = process.env.SESSION_ID || config.sessionID;

  if (botSessionID && botSessionID.startsWith('Kosem!') && !fs.existsSync(sessionFile)) {
    try {
      console.log("📥 Downloading Session ID...");
      const [header, b64data] = botSessionID.split('!');

      if (header !== 'Kosem' || !b64data) throw new Error("❌ Invalid session format.");

      const cleanB64 = b64data.replace('...', '');
      const compressedData = Buffer.from(cleanB64, 'base64');
      const decompressedData = zlib.gunzipSync(compressedData);

      if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
      }

      fs.writeFileSync(sessionFile, decompressedData, 'utf8');
      console.log('✅ Session ID successfully loaded! Bot is connecting...');

    } catch (e) {
      console.error('❌ Error processing Kosem session:', e.message);
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();
  const suppressedLogger = createSuppressedLogger('silent');

  const sock = makeWASocket({
    version,
    logger: suppressedLogger,
    printQRInTerminal: false,
    browser: ['Chrome', 'Windows', '10.0'],
    auth: state,
    syncFullHistory: false,
    downloadHistory: false,
    markOnlineOnConnect: false,
    getMessage: async () => undefined
  });

  store.bind(sock.ev);
  isStarting = false;

  let lastActivity = Date.now();
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; 

  sock.ev.on('messages.upsert', () => { lastActivity = Date.now(); });

  const watchdogInterval = setInterval(async () => {
    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && sock.ws.readyState === 1) {
      console.log('⚠️ No activity detected. Forcing reconnect...');
      await sock.end(undefined, undefined, { reason: 'inactive' });
      clearInterval(watchdogInterval);
    }
  }, 5 * 60 * 1000);

  sock.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'open') {
      lastActivity = Date.now();
    } else if (connection === 'close') {
      clearInterval(watchdogInterval);
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
      let shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      // 🛠️ STREAM CONFLICT FIX
      if (statusCode === 409 || errorMessage.includes('conflict')) {
        console.log(`⚠️ Connection Conflict Detected! Waiting 15 seconds before reconnecting...`);
        reconnectCount++;
        if (reconnectCount > 10) {
            console.log("🚨 Too many conflicts! The session file seems corrupt. Please generate a new Session ID.");
            reconnectCount = 0;
        }
        setTimeout(() => startBot(), 15000);
      } else {
        if (statusCode === 515 || statusCode === 503 || statusCode === 408) {
          console.log(`⚠️ Connection closed (${statusCode}). Reconnecting...`);
        } else {
          console.log('Connection closed due to:', errorMessage, '\nReconnecting:', shouldReconnect);
        }

        if (shouldReconnect) {
          setTimeout(() => startBot(), 3000);
        }
      }
    } else if (connection === 'open') {
      reconnectCount = 0; // Reset counter on success
      console.log('\n✅ Bot connected successfully!');
      console.log(`📱 Bot Number: ${sock.user.id.split(':')[0]}`);
      console.log(`🤖 Bot Name: ${config.botName}`);
      console.log(`⚡ Prefix: ${config.prefix}`);
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
      console.log(`👑 Owner: ${ownerNames}\n`);
      console.log('Bot is ready to receive messages!\n');

      if (config.autoBio) {
        await sock.updateProfileStatus(`${config.botName} | Active 24/7`);
      }

      handler.initializeAntiCall(sock);

      const now = Date.now();
      for (const [jid, chatMsgs] of store.messages.entries()) {
        const timestamps = Array.from(chatMsgs.values()).map(m => m.messageTimestamp * 1000 || 0);
        if (timestamps.length > 0 && now - Math.max(...timestamps) > 24 * 60 * 60 * 1000) {
          store.messages.delete(jid);
        }
      }
      console.log(`🧹 Store cleaned. Active chats: ${store.messages.size}`);
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
      if (!from) continue; // Allow broadcast for Anti-Status, but block it down below for normal handler

      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;
      processedMessages.add(msgId);

      // 🛠️ RESTORED YOUR FEATURES (AutoRead, Antilink, ViewOnce)
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
  // 🔴 PREMIUM ANTI-DELETE SYSTEM (FIXED FOR CRASHES & PKT TIME) 🔴
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

          // 🛠️ SENDER FIX
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
            } catch (e) {
              chatName = from.split('@')[0];
            }
          } else if (isStatus) {
            chatName = "WhatsApp Status";
          } else {
            chatName = deletedMsg.pushName || "Private Chat";
          }

          // 🕰️ TIME FIX: PKT Timezone
          const time = new Date().toLocaleTimeString('en-US', { 
              timeZone: 'Asia/Karachi',
              hour: 'numeric', 
              minute: 'numeric', 
              hour12: true 
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

          let caption = `❖ ── ✦ 𝐀𝐍𝐓𝐈 𝐃𝐄𝐋𝐄𝐓𝐄 ✦ ── ❖\n\n`;
          caption += `👤 *Sender:* @${senderNumber}\n`;
          caption += `📍 *Chat:* ${chatName}\n`;
          caption += `🕰️ *Time:* ${time}\n`;
          caption += `📦 *Deleted:* ${mediaType}\n`;

          if (originalText) {
              caption += `\n❖ ── ✦ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ✦ ── ❖\n💬 ${originalText}`;
          } else if (mediaType === "Text Message" || mediaType === "Text Status") {
              caption += `\n❖ ── ✦ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ✦ ── ❖\n💬 [Message deleted]`;
          }

          if (msgObj.imageMessage || msgObj.videoMessage) {
              if (msgObj.imageMessage) {
                  msgObj.imageMessage.caption = caption;
                  msgObj.imageMessage.contextInfo = { mentionedJid: [cleanSender] };
              }
              if (msgObj.videoMessage) {
                  msgObj.videoMessage.caption = caption;
                  msgObj.videoMessage.contextInfo = { mentionedJid: [cleanSender] };
              }
              await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
          } else {
              await sock.sendMessage(myJid, { text: caption, mentions: [cleanSender] }).catch(()=>{});
              const hasMedia = msgObj.audioMessage || msgObj.stickerMessage || msgObj.documentMessage || msgObj.contactMessage || msgObj.locationMessage;
              if (hasMedia) {
                await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
              }
          }
        } catch (err) {
          // SAFE CATCH TO PREVENT CRASH
          // console.error('Minor Anti-Delete Warning: Unable to parse media.');
        }
      }
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
    try { await handler.handleGroupUpdate(sock, update); } catch(e){}
  });

  sock.ev.on('error', (error) => {
    const statusCode = error?.output?.statusCode;
    if (statusCode === 515 || statusCode === 503 || statusCode === 408) return;
    console.error('Socket error:', error.message || error);
  });

  return sock;
}

console.log('🚀 Starting WhatsApp MD Bot...\n');
console.log(`📦 Bot Name: ${config.botName}`);
console.log(`⚡ Prefix: ${config.prefix}`);
const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
console.log(`👑 Owner: ${ownerNames}\n`);

cleanupPuppeteerCache();

startBot().catch(err => {
    console.error('Error starting bot:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    if (err.code === 'ENOSPC' || err.errno === -28 || err.message?.includes('no space left on device')) {
        console.error('⚠️ ENOSPC Error: No space left on device. Attempting cleanup...');
        const { cleanupOldFiles } = require('./utils/cleanup');
        cleanupOldFiles();
        return; 
    }
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    if (err.code === 'ENOSPC' || err.errno === -28 || err.message?.includes('no space left on device')) {
        const { cleanupOldFiles } = require('./utils/cleanup');
        cleanupOldFiles();
        return;
    }
    if (err.message && err.message.includes('rate-overlimit')) return;
    console.error('Unhandled Rejection:', err);
});

module.exports = { store };

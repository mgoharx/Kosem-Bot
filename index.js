/**
 * WhatsApp MD Bot - Main Entry Point
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

if (typeof global.isAlwaysOnline === 'undefined') {
    global.isAlwaysOnline = false;
}

// 🚀 REAL-TIME BOOT SYSTEM VARIABLES
global.isBotReady = false;
let offlineMsgCount = 0;
let bootUnlockTimer = null;
const BOT_START_TIME = Date.now();

// ==========================================
// 💎 AGGRESSIVE NOISE SUPPRESSOR (Kills Crypto Logs)
// ==========================================
const util = require('util');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const forbiddenPatternsConsole = [
  'closing session', 'closing open session', 'sessionentry', 
  'prekey bundle', 'pendingprekey', '_chains', 'registrationid', 
  'currentratchet', 'chainkey', 'ratchet', 'signal protocol', 
  'ephemeralkeypair', 'indexinfo', 'basekey', 'pubkey', 'privkey', 
  '<buffer', 'lastremoteephemeralkey', 'previouscounter', 'rootkey',
  'bad mac', 'failed to decrypt', 'session error', 'verifymac', 'conflict'
];

function isNoisy(args) {
    const msg = args.map(a => typeof a === 'string' ? a : util.inspect(a, { depth: 5 })).join(' ').toLowerCase();
    return forbiddenPatternsConsole.some(pattern => msg.includes(pattern));
}

console.log = (...args) => {
    if (isNoisy(args)) return;
    const msg = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    originalConsoleLog(`✦ ${msg}`);
};
console.error = (...args) => {
    if (isNoisy(args)) return;
    const msg = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    originalConsoleError(`❌ ERROR: ${msg}`);
};
console.warn = (...args) => {
    if (isNoisy(args)) return;
    const msg = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    originalConsoleWarn(`⚠️ WARN: ${msg}`);
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
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  } catch (err) {}
}

// 🚀 ORIGINAL MEMORY STORE (Lag-Free Anti-Delete base)
const store = {
  messages: new Map(),
  maxPerChat: 30, 
  bind: (ev) => {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key?.id) continue;
        const jid = msg.key.remoteJid;
        if (!store.messages.has(jid)) store.messages.set(jid, new Map());
        const chatMsgs = store.messages.get(jid);
        chatMsgs.set(msg.key.id, msg);
        if (chatMsgs.size > store.maxPerChat) chatMsgs.delete(chatMsgs.keys().next().value);
      }
    });
  },
  loadMessage: async (jid, id) => store.messages.get(jid)?.get(id) || null
};

const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 5 * 60 * 1000); 

const createSuppressedLogger = (level = 'silent') => {
  let logger = pino({ level });
  const originalInfo = logger.info.bind(logger);
  logger.info = (...args) => {
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ').toLowerCase();
    if (!forbiddenPatternsConsole.some(pattern => msg.includes(pattern))) {
      originalInfo(...args);
    }
  };
  logger.debug = () => { }; 
  logger.trace = () => { }; 
  return logger;
};

// 🚀 REAL BOOT MESSAGE (Sent ONLY when Backlog is 100% Cleared)
async function sendPremiumBootMessage(sock) {
    try {
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'; 
        const botName = config.botName || 'Kosem Bot';
        const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(', ') : config.ownerName;
        
        const bootText = `❖ ── ✦ 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐄 ✦ ── ❖\n\n` +
                         `✨ *${botName} is Connected!*\n\n` +
                         `👑 *Owner:* ${ownerNames}\n` +
                         `🟢 *Status:* Ready for Commands ⚡\n\n` +
                         `📝 *Description:* Advanced WhatsApp Bot by Muhammad Gohar.\n` +
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
        console.log('\n✦ Boot message delivered successfully!');
    } catch (err) {}
}

async function startBot() {
  cleanupPuppeteerCache();

  const sessionFolder = `./${config.sessionName}`;
  const sessionFile = path.join(sessionFolder, 'creds.json');
  const botSessionID = process.env.SESSION_ID || config.sessionID;

  if (botSessionID && botSessionID.startsWith('Kosem!') && !fs.existsSync(sessionFile)) {
    try {
      const [header, b64data] = botSessionID.split('!');
      if (header === 'Kosem' && b64data) {
        const decompressedData = zlib.gunzipSync(Buffer.from(b64data.replace('...', ''), 'base64'));
        if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(sessionFile, decompressedData, 'utf8');
      }
    } catch (e) {}
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

  let lastActivity = Date.now();
  sock.ev.on('messages.upsert', () => { lastActivity = Date.now(); });

  const watchdogInterval = setInterval(async () => {
    if (Date.now() - lastActivity > 30 * 60 * 1000 && sock.ws?.readyState === 1) {
      await sock.end(undefined, undefined, { reason: 'inactive' });
      clearInterval(watchdogInterval);
      setTimeout(() => startBot(), 5000); 
    }
  }, 5 * 60 * 1000);

  setInterval(async () => {
    if (!sock || !global.isBotReady) return;
    try { await sock.sendPresenceUpdate(global.isAlwaysOnline ? 'available' : 'unavailable'); } catch(e) {}
  }, 30000);

  sock.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'open') lastActivity = Date.now(); 
    else if (connection === 'close') clearInterval(watchdogInterval);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      global.isBotReady = false; 
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === 409 || String(lastDisconnect?.error).includes('conflict')) {
        process.exit(1); 
      } else {
        if (statusCode !== DisconnectReason.loggedOut) setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {
      console.log(`✅ CONNECTED SECURELY | Bot: ${config.botName}`);
      
      if (config.autoBio) await sock.updateProfileStatus(`${config.botName} | Active 24/7`);
      handler.initializeAntiCall(sock);
      try { await sock.sendPresenceUpdate('unavailable'); } catch(e) {}

      // 🚀 START THE REAL DRAINER TIMER
      // Agar bot start honay ke 4 second tak koi message nahi aata, toh system foran unlock ho jayega
      bootUnlockTimer = setTimeout(() => {
          global.isBotReady = true;
          console.log(`\n✦ ✅ System Unlocked! No pending messages found.`);
          sendPremiumBootMessage(sock);
      }, 4000);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const isSystemJid = (jid) => !jid || jid.includes('@broadcast') || jid.includes('status.broadcast') || jid.includes('@newsletter');

  // ==========================================
  // 🚀 HIGH-SPEED COMMAND HANDLER (CPU Saver)
  // ==========================================
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;

      // 🛑 REAL-TIME OFFLINE DRAINER LOGIC
      // Agar message old hai (bot start hone se pichlay waqt ka)
      const isOldMessage = msg.messageTimestamp && (msg.messageTimestamp * 1000) < BOT_START_TIME;

      if (!global.isBotReady) {
          if (isOldMessage) {
              offlineMsgCount++;
              // Yeh line console mein real-time counter chalayegi!
              process.stdout.write(`\r✦ 📥 Processing Offline Backlog: ${offlineMsgCount} messages drained... `);
              
              // Flood aane par timer reset karo. Jab flood rukega (3 sec shanti), tab bot unlock hoga!
              clearTimeout(bootUnlockTimer);
              bootUnlockTimer = setTimeout(() => {
                  global.isBotReady = true;
                  console.log(`\n✦ ✅ Backlog Cleared! Total ${offlineMsgCount} old messages bypassed safely.`);
                  sendPremiumBootMessage(sock);
              }, 3000); 
              
              // THE CPU SAVER: Puranay message ko command ke liye handler mein MAT bhejo! Speed 1000x fast.
              continue; 
          }
      }

      // Agar system abhi ready nahi hai aur naya message bhi aa gaya hai, toh usko block karo taake lag na ho
      if (!global.isBotReady) continue;

      // --- YAHAN SE SIRF NAYE MESSAGES PASS HONGE ---

      const from = msg.key.remoteJid;
      if (!from || isSystemJid(from)) continue;

      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;
      processedMessages.add(msgId);

      // 🔮 Server Time Desync Bypass
      msg.messageTimestamp = Math.floor(Date.now() / 1000); 

      // Send to handler
      handler.handleMessage(sock, msg).catch(err => {
        if (!err.message?.includes('rate-overlimit') && !err.message?.includes('not-authorized')) {
          const errMsg = err.message.toLowerCase();
          if (!forbiddenPatternsConsole.some(pattern => errMsg.includes(pattern))) {
            console.error(`Error handling message: ${err.message}`);
          }
        }
      });

      // Background tasks
      setImmediate(async () => {
        if (config.autoRead && from.endsWith('@g.us')) {
          try { await sock.readMessages([msg.key]); } catch (e) { }
        }
        if (from.endsWith('@g.us')) {
          try {
            const groupMetadata = await handler.getGroupMetadata(sock, msg.key.remoteJid);
            if (groupMetadata) await handler.handleAntilink(sock, msg, groupMetadata);
          } catch (error) { }
        }
      });
    }
  });

  sock.ev.on('message-receipt.update', () => { });

  // ==========================================
  // 🔴 ANTI-DELETE ENGINE
  // ==========================================
  sock.ev.on('messages.update', async (chatUpdate) => {
    // Prevent Anti-Delete from choking the system during the boot drain
    if (!global.isBotReady) return; 

    for (const { key, update } of chatUpdate) {
      
      let isDeletedMessage = false;
      if (update.message === null) isDeletedMessage = true;
      else if (update.message?.protocolMessage && (update.message.protocolMessage.type === 0 || update.message.protocolMessage.type === 'REVOKE')) {
          isDeletedMessage = true;
      }

      if (!isDeletedMessage) continue; 

      try {
        const deletedMsg = await store.loadMessage(key.remoteJid, key.id);
        if (!deletedMsg) return;

        const from = key.remoteJid;
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        let rawSender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
        if (!rawSender) return;
        const cleanSender = rawSender.includes(':') ? rawSender.split(':')[0] + '@s.whatsapp.net' : rawSender;
        const senderNumber = cleanSender.split('@')[0];
        
        if (cleanSender === myJid) return;

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
        let chatName = isGroup ? "Group Chat" : (isStatus ? "WhatsApp Status" : "Private Chat");

        const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: 'numeric', hour12: true });

        let mediaType = "Message";
        if (msgObj.imageMessage) mediaType = "Photo";
        else if (msgObj.videoMessage || msgObj.ptvMessage) mediaType = "Video";
        else if (msgObj.audioMessage) mediaType = msgObj.audioMessage.ptt ? "Voice Note" : "Audio";
        else if (msgObj.documentMessage) mediaType = "Document";
        else if (msgObj.stickerMessage) mediaType = "Sticker";

        const originalText = msgObj.conversation || msgObj.extendedTextMessage?.text || msgObj.imageMessage?.caption || msgObj.videoMessage?.caption || "";

        let caption = `❖ ── ✦ 𝐀𝐍𝐓𝐈 𝐃𝐄𝐋𝐄𝐓𝐄 ✦ ── ❖\n\n👤 *By:* @${senderNumber}\n📍 *From:* ${chatName}\n🕰️ *Time:* ${time}\n📦 *Type:* ${mediaType}\n`;

        if (originalText) caption += `\n❖ ── ✦ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ✦ ── ❖\n💬 ${originalText}`;
        else if (mediaType === "Message") caption += `\n❖ ── ✦ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ✦ ── ❖\n💬 [Text Deleted]`;

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
            const hasMedia = msgObj.audioMessage || msgObj.stickerMessage || msgObj.documentMessage;
            if (hasMedia) await sock.sendMessage(myJid, { forward: deletedMsg }).catch(()=>{});
        }
      } catch (err) {} 
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
    if (!global.isBotReady) return;
    try { await handler.handleGroupUpdate(sock, update); } catch(e){}
  });

  return sock;
}

console.log('🚀 Starting WhatsApp MD Bot...');
startBot().catch(err => {
  console.error(`Error starting bot: ${err}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (err.code === 'ENOSPC' || err.message?.includes('no space left')) {
    console.warn('⚠️ Storage full. Attempting cleanup...');
    require('./utils/cleanup').cleanupOldFiles();
  }
});
process.on('unhandledRejection', (err) => {
  if (err.message && err.message.includes('rate-overlimit')) return;
});
module.exports = { store };

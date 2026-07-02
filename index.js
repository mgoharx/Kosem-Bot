/**
 * WhatsApp MD Bot - Main Entry Point
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

// ⏱️ BOT UPTIME TRACKER (For Anti-Spam Fix)
const BOT_START_TIME = Date.now();

const { initializeTempSystem } = require('./utils/tempManager');
const { startCleanup } = require('./utils/cleanup');
initializeTempSystem();
startCleanup();

// Now safe to load libraries
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

// Remove Puppeteer cache
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

// Optimized in-memory store
const store = {
  messages: new Map(),
  maxPerChat: 500, // Safe limit for anti-delete

  bind: (ev) => {
    ev.on('messages.upsert', ({ messages, type }) => {
      // 🚀 FAST BOOT FIX: Ignore old history sync messages completely!
      if (type !== 'notify') return; 

      for (const msg of messages) {
        if (!msg.key?.id) continue;
        
        // Extra protection: Ignore messages sent before bot started
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

// Main connection function
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
  
  // 🔇 STRICT LOG SILENCING: This permanently disables the SessionEntry/Buffer logs
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

      // 🚨 GHOST PROCESS KILLER (Fixes the Double Bot Issue)
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
      
      // ==========================================
      // 🔴 THE FIX: FREEZE LAST SEEN (Offline Mode)
      // ==========================================
      await sock.sendPresenceUpdate('unavailable');
      // ==========================================

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
      // 🚀 THE FIX: CUSTOM VIP BOOT MESSAGE
      // ==========================================
      try {
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'; // Aapka apna chat "You"
        const botName = config.botName || 'Kosem Bot';
        
        const bootText = `❖ ─── ✦ 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐄 ✦ ─── ❖\n\n` +
                         `✨ *${botName} is successfully connected and Online!*\n\n` +
                         `👑 *Owner:* ${ownerNames}\n` +
                         `🟢 *Status:* Active\n\n` +
                         `📝 *Description:* This is an advanced WhatsApp bot made by Muhammad Gohar.\n` +
                         `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        await sock.sendMessage(myJid, {
          text: bootText,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            // Sirf Channel Banner aur native "View channel" button aayega
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363427491383372@newsletter', // Aapki Channel JID
              newsletterName: `✨ ${botName} Official`,
              serverMessageId: -1
            }
          }

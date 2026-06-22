/**
 * ATTP - Animated Text to Picture Sticker (Ultra-HD Auto-Scaling RGB Edition)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { writeExifVid } = require('../../utils/exif');

module.exports = {
  name: 'attp',
  aliases: ['ttp'],
  category: 'general',
  description: 'Create premium auto-scaling RGB animated text sticker',
  usage: '<text>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(`❖ ── ✦ 𝐀𝐓𝐓𝐏 ✦ ── ❖\n\n❌ *Text Missing*\nPlease provide text to animate.\n\n👉 *Example:* \`${extra.prefix || '.'}attp Knight Bot\`\n╰━━━━━━━━━━━━━━━━━━━━━━━`);
      }
      
      const text = args.join(' ');
      if (text.length > 70) { // Limit increased slightly because of auto-scaling
        return extra.reply('❖ ── ✦ 𝐀𝐓𝐓𝐏 ✦ ── ❖\n\n❌ *Text Limit Exceeded*\nMaximum 70 characters allowed.\n╰━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      if (extra.react) await extra.react('⏳');

      try {
        const webmBuffer = await renderBlinkingVideoWithFfmpeg(text);
        const webpBuffer = await writeExifVid(webmBuffer, { packname: 'Kosem Bot', author: 'Gohar' });
        
        await sock.sendMessage(extra.from, { sticker: webpBuffer }, { quoted: msg });
        if (extra.react) await extra.react('✅');

      } catch (error) {
        console.error('Error generating attp sticker:', error);
        await extra.reply('❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ Failed to generate the animated sticker.\n╰━━━━━━━━━━━━━━━━━━━━━━━');
      }
    } catch (error) {
      console.error('ATTP command error:', error);
      await extra.reply('❖ ── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ── ❖\n\n❌ An unexpected error occurred while creating the sticker!\n╰━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }
};

function renderBlinkingVideoWithFfmpeg(text) {
  return new Promise((resolve, reject) => {
    const fontPath = process.platform === 'win32'
      ? 'C:/Windows/Fonts/impact.ttf' // Changed to Impact for a bolder, premium gaming look
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

    // Advanced Text Escaping
    const escapeDrawtextText = (s) => s
      .replace(/\\/g, '\\\\')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,')
      .replace(/'/g, "\\'")
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/%/g, '\\%');

    // 🚀 AUTO-SCALING LOGIC (Fit to Box)
    // Agar text lamba hai, toh usko line break (new line) de dega taake bahar na jaye
    let formattedText = text;
    if (text.length > 15) {
        const words = text.split(' ');
        let currentLine = '';
        const lines = [];
        
        for (const word of words) {
            if ((currentLine + word).length > 15) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        }
        lines.push(currentLine.trim());
        formattedText = lines.join('\n'); // Add actual line breaks
    }

    const safeText = escapeDrawtextText(formattedText);
    const safeFontPath = process.platform === 'win32'
      ? fontPath.replace(/\\/g, '/').replace(':', '\\:')
      : fontPath;

    // 🚀 DYNAMIC FONT SIZE: Text jitna lamba, font utna chota hoga
    const linesCount = formattedText.split('\n').length;
    let fontSize = 85; 
    if (linesCount === 2) fontSize = 65;
    if (linesCount >= 3) fontSize = 50;

    const dur = 1.8; 
    const cycle = 0.6; 

    // 🚀 PREMIUM 4K SHADOWS & NEON BORDER
    const getDrawText = (color, startTime, endTime, isLast = false) => {
      const enableCondition = isLast 
        ? `gte(mod(t\\,${cycle})\\,${startTime})` 
        : `between(mod(t\\,${cycle})\\,${startTime}\\,${endTime})`;

      // line_spacing=10 (lines ke darmiyan space), borderw=5 (Ultra thick outline)
      return `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=${color}:borderw=5:bordercolor=white:shadowcolor=black@0.9:shadowx=6:shadowy=6:fontsize=${fontSize}:line_spacing=15:x=(w-text_w)/2:y=(h-text_h)/2:enable='${enableCondition}'`;
    };

    const drawRed     = getDrawText('#FF0033', 0, 0.1);    // Premium Red
    const drawYellow  = getDrawText('#FFD700', 0.1, 0.2);  // Gold Yellow
    const drawGreen   = getDrawText('#00FF00', 0.2, 0.3);  // Neon Green
    const drawCyan    = getDrawText('#00FFFF', 0.3, 0.4);  // Bright Cyan
    const drawBlue    = getDrawText('#0066FF', 0.4, 0.5);  // Deep Blue
    const drawMagenta = getDrawText('#FF00FF', 0.5, 0.6, true); // Neon Pink

    const filter = `${drawRed},${drawYellow},${drawGreen},${drawCyan},${drawBlue},${drawMagenta}`;

    // 🚀 HIGH QUALITY RENDERING (Anti-Aliasing + Higher Bitrate)
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=black@0:s=512x512:d=${dur}:r=30,format=rgba`, // Increased Frame Rate to 30fps for smoother blink
      '-vf', filter,
      '-c:v', 'libvpx-vp9', 
      '-b:v', '2M', // High Bitrate for Crystal Clear Quality
      '-pix_fmt', 'yuva420p', 
      '-auto-alt-ref', '0',
      '-t', String(dur),
      '-f', 'webm',
      'pipe:1'
    ];

    const ff = spawn('ffmpeg', args);
    const chunks = [];
    const errors = [];
    
    ff.stdout.on('data', d => chunks.push(d));
    ff.stderr.on('data', e => errors.push(e));
    ff.on('error', reject);
    ff.on('close', code => {
      if (code === 0) return resolve(Buffer.concat(chunks));
      reject(new Error(Buffer.concat(errors).toString() || `ffmpeg exited with code ${code}`));
    });
  });
}

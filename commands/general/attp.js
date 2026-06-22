/**
 * ATTP - Animated Text to Picture Sticker (100% Crop-Proof RGB Edition)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { writeExifVid } = require('../../utils/exif');

module.exports = {
  name: 'attp',
  aliases: ['ttp'],
  category: 'utility',
  description: 'Create premium auto-scaling RGB animated text sticker',
  usage: '<text>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(`❖ ── ✦ 𝐀𝐓𝐓𝐏 ✦ ── ❖\n\n❌ *Text Missing*\nPlease provide text to animate.\n\n👉 *Example:* \`${extra.prefix || '.'}attp Knight Bot\`\n╰━━━━━━━━━━━━━━━━━━━━━━━`);
      }
      
      const text = args.join(' ');
      if (text.length > 80) { // Limit barha di gayi hai
        return extra.reply('❖ ── ✦ 𝐀𝐓𝐓𝐏 ✦ ── ❖\n\n❌ *Text Limit Exceeded*\nMaximum 80 characters allowed.\n╰━━━━━━━━━━━━━━━━━━━━━━━');
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
      ? 'C:/Windows/Fonts/impact.ttf' 
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

    const escapeDrawtextText = (s) => s
      .replace(/\\/g, '\\\\')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,')
      .replace(/'/g, "\\'")
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/%/g, '\\%');

    // 🚀 EXTREME WORD-WRAP ALGORITHM (Bahar nikalna namumkin)
    let maxLineLength = 12; // Base safe line length
    if (text.length > 40) maxLineLength = 15;
    
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (let word of words) {
      // Force split very long words without spaces
      while (word.length > maxLineLength) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(word.slice(0, maxLineLength));
        word = word.slice(maxLineLength);
      }
      
      if (!word) continue;

      if ((currentLine + ' ' + word).trim().length > maxLineLength) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    const formattedText = lines.join('\n');
    const safeText = escapeDrawtextText(formattedText);
    const safeFontPath = process.platform === 'win32'
      ? fontPath.replace(/\\/g, '/').replace(':', '\\:')
      : fontPath;

    // 🚀 MATHEMATICAL FONT SCALING (Perfect fit logic)
    const lineCount = lines.length;
    const maxCharsInLine = Math.max(...lines.map(l => l.length));

    // Safe zone is 450px out of 512px (leaves huge padding for borders/shadows)
    let fontSizeByWidth = Math.floor(450 / (maxCharsInLine * 0.6)); // Avg character width ratio
    let fontSizeByHeight = Math.floor(450 / (lineCount * 1.3));     // Including line spacing

    // Select the safest font size
    let fontSize = Math.min(fontSizeByWidth, fontSizeByHeight);
    
    // Bounds for extreme cases
    if (fontSize > 100) fontSize = 100;
    if (fontSize < 30) fontSize = 30; 

    const dur = 1.8; 
    const cycle = 0.6; 

    const getDrawText = (color, startTime, endTime, isLast = false) => {
      const enableCondition = isLast 
        ? `gte(mod(t\\,${cycle})\\,${startTime})` 
        : `between(mod(t\\,${cycle})\\,${startTime}\\,${endTime})`;

      return `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=${color}:borderw=5:bordercolor=white:shadowcolor=black@0.9:shadowx=6:shadowy=6:fontsize=${fontSize}:line_spacing=10:x=(w-text_w)/2:y=(h-text_h)/2:enable='${enableCondition}'`;
    };

    const drawRed     = getDrawText('#FF0033', 0, 0.1);    
    const drawYellow  = getDrawText('#FFD700', 0.1, 0.2);  
    const drawGreen   = getDrawText('#00FF00', 0.2, 0.3);  
    const drawCyan    = getDrawText('#00FFFF', 0.3, 0.4);  
    const drawBlue    = getDrawText('#0066FF', 0.4, 0.5);  
    const drawMagenta = getDrawText('#FF00FF', 0.5, 0.6, true); 

    const filter = `${drawRed},${drawYellow},${drawGreen},${drawCyan},${drawBlue},${drawMagenta}`;

    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=black@0:s=512x512:d=${dur}:r=30,format=rgba`, 
      '-vf', filter,
      '-c:v', 'libvpx-vp9', 
      '-b:v', '2M', 
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

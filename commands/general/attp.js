/**
 * ATTP - Animated Text to Picture Sticker (Premium RGB Edition)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { writeExifVid } = require('../../utils/exif');

module.exports = {
  name: 'attp',
  aliases: ['ttp'],
  category: 'utility',
  description: 'Create premium animated RGB text sticker',
  usage: '<text>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(`❖ ── ✦ 𝐀𝐓𝐓𝐏 ✦ ── ❖\n\n❌ *Text Missing*\nPlease provide text to animate.\n\n👉 *Example:* \`${extra.prefix || '.'}attp Hello World\`\n╰━━━━━━━━━━━━━━━━━━━━━━━`);
      }
      
      const text = args.join(' ');
      if (text.length > 50) {
        return extra.reply('❖ ── ✦ 𝐀𝐓𝐓𝐏 ✦ ── ❖\n\n❌ *Text Limit Exceeded*\nMaximum 50 characters allowed.\n╰━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      // Sending a wait reaction
      if (extra.react) await extra.react('⏳');

      try {
        // Generate the transparent WEBM buffer
        const webmBuffer = await renderBlinkingVideoWithFfmpeg(text);
        
        // Convert to WebP sticker with Exif (Author Metadata)
        const webpBuffer = await writeExifVid(webmBuffer, { packname: 'Kosem Bot', author: 'Gohar' });
        
        // Send the final sticker
        await sock.sendMessage(extra.from, { sticker: webpBuffer }, { quoted: msg });
        
        // Success reaction
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
      ? 'C:/Windows/Fonts/arialbd.ttf'
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

    const escapeDrawtextText = (s) => s
      .replace(/\\/g, '\\\\')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,')
      .replace(/'/g, "\\'")
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/%/g, '\\%');

    const safeText = escapeDrawtextText(text);
    const safeFontPath = process.platform === 'win32'
      ? fontPath.replace(/\\/g, '/').replace(':', '\\:')
      : fontPath;

    // 🚀 RGB GAMING LOGIC (6 Colors Rapid Cycle)
    const dur = 1.8; 
    const cycle = 0.6; // Pura cycle 0.6 sec ka, har color 0.1 sec dikhega

    // Function to generate premium 3D text layers
    const getDrawText = (color, startTime, endTime, isLast = false) => {
      // borderw=4 (Thick White Outline), shadowx/y=5 (3D Black Drop Shadow)
      const enableCondition = isLast 
        ? `gte(mod(t\\,${cycle})\\,${startTime})` 
        : `between(mod(t\\,${cycle})\\,${startTime}\\,${endTime})`;

      return `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=${color}:borderw=4:bordercolor=white:shadowcolor=black@0.8:shadowx=5:shadowy=5:fontsize=75:x=(w-text_w)/2:y=(h-text_h)/2:enable='${enableCondition}'`;
    };

    // Generating 6 Color Layers
    const drawRed     = getDrawText('red', 0, 0.1);
    const drawYellow  = getDrawText('yellow', 0.1, 0.2);
    const drawGreen   = getDrawText('#00FF00', 0.2, 0.3); // Neon Green
    const drawCyan    = getDrawText('cyan', 0.3, 0.4);
    const drawBlue    = getDrawText('#0088FF', 0.4, 0.5); // Vibrant Blue
    const drawMagenta = getDrawText('magenta', 0.5, 0.6, true);

    const filter = `${drawRed},${drawYellow},${drawGreen},${drawCyan},${drawBlue},${drawMagenta}`;

    // 🚀 THE MAGIC: Output transparent WEBM instead of solid MP4
    const args = [
      '-y',
      '-f', 'lavfi',
      // black@0 means 100% transparent background
      '-i', `color=c=black@0:s=512x512:d=${dur}:r=20,format=rgba`,
      '-vf', filter,
      '-c:v', 'libvpx-vp9', // Codec that supports transparency
      '-pix_fmt', 'yuva420p', // 'a' stands for Alpha (Transparency)
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

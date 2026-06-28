/**
 * 👑 Kosem Bot Premium Voice AI
 * 100% Free & Playable - Native Google TTS Engine
 * Fixed WhatsApp Audio Corruption Issue
 */

module.exports = {
    name: 'voice',
    aliases: ['speak', 'say', 'audio'],
    category: 'ai',
    description: 'Convert text to High-Quality AI Audio',
    usage: '.voice <voice_name> <text>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 🎙️ PREMIUM VOICE DICTIONARY (Mapped to Regional Accents)
            const voiceMap = {
                'Matthew': 'en-US',  // American English
                'Brian': 'en-GB',    // British English
                'Russell': 'en-AU',  // Australian English
                'Raveena': 'en-IN',  // Indian English
                'Aditi': 'hi',       // Hindi (Perfect for Desi text)
                'Tariq': 'ur'        // Urdu (Pakistani Accent)
            };
            
            const availableVoices = Object.keys(voiceMap);
            
            // Show Help Menu if no arguments
            if (!args[0]) {
                let helpText = `❖ ───── ✦ 𝐕𝐎𝐈𝐂𝐄 𝐀𝐈 ✦ ───── ❖\n\n`;
                helpText += `🎙️ *Premium AI Accents Available:*\n\n`;
                helpText += `🇺🇸 *US:* Matthew\n`;
                helpText += `🇬🇧 *UK:* Brian\n`;
                helpText += `🇦🇺 *Aussie:* Russell\n`;
                helpText += `🇮🇳 *Indian:* Raveena, Aditi\n`;
                helpText += `🇵🇰 *Pakistani:* Tariq\n\n`;
                helpText += `💡 *How to use:*\n`;
                helpText += `\`.voice Tariq Gohar bhai, system online hai!\`\n`;
                helpText += `\`.voice Matthew System is fully operational.\`\n`;
                helpText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                
                if (extra.react) await extra.react('ℹ️');
                return await sock.sendMessage(msg.key.remoteJid, { text: helpText }, { quoted: msg });
            }

            if (extra.react) await extra.react('⏳');

            // Determine Voice and Text
            let selectedVoice = 'Matthew'; // Default Voice
            let textToSpeak = '';

            // Check if the first word is a voice name
            const firstArg = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
            
            if (availableVoices.includes(firstArg)) {
                selectedVoice = firstArg;
                textToSpeak = args.slice(1).join(' ').trim(); // Remove the voice name from text
            } else {
                textToSpeak = args.join(' ').trim(); // Use default voice and whole text
            }

            if (!textToSpeak) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Text Missing*\n`;
                errText += `💡 You selected the voice but didn't write any text!\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
            }

            // Slice text to prevent Google API overload
            const safeText = textToSpeak.substring(0, 200);

            console.log(`[BOT] [KOSEM BOT] 🟢 Generating Audio... Accent: ${selectedVoice}`);

            // 🚀 NATIVE GOOGLE TTS API
            const langCode = voiceMap[selectedVoice];
            const apiUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(safeText)}`;

            const fetchVoice = async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://translate.google.com/'
                    }
                });

                if (!response.ok) throw new Error(`API failed with status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            };

            // Download the MP3 Buffer
            const audioBuffer = await fetchVoice(apiUrl);

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error("Received empty audio buffer");
            }

            console.log(`[BOT] [KOSEM BOT] 🟢 Audio Generated Successfully!`);

            // 🚀 FINAL DELIVERY: Send as a Standard MP3 Audio File
            if (extra.react) await extra.react('✅');
            
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg', // 🔥 FIXED: Correct MP3 format so WhatsApp doesn't corrupt it
                ptt: false // 🔥 FIXED: Sent as normal audio instead of forced voice note
            }, { quoted: msg });

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            
            let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
            errText += `❌ *System Crash*\n`;
            errText += `💡 Kosem Bot encountered an error while generating the voice. Please try again.\n`;
            errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: errText }, { quoted: msg });
        }
    }
};

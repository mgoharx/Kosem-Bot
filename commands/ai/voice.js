/**
 * 👑 Kosem Bot Premium Voice AI
 * 100% Free - Amazon Polly Backend via StreamElements
 * High Quality, Instant Response, Zero Blocks!
 */

module.exports = {
    name: 'voice',
    aliases: ['tts', 'speak', 'say', 'audio'],
    category: 'ai',
    description: 'Convert text to High-Quality AI Voice Notes',
    usage: '.voice <voice_name> <text>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 🎙️ PREMIUM VOICE LIST
            // US: Matthew (Male), Salli (Female), Justin (Boy)
            // UK: Brian (Male), Amy (Female)
            // Indian Accent: Aditi (Female), Raveena (Female)
            // Australian: Russell (Male), Nicole (Female)
            const availableVoices = ['Matthew', 'Salli', 'Justin', 'Brian', 'Amy', 'Aditi', 'Raveena', 'Russell', 'Nicole'];
            
            // Show Help Menu if no arguments
            if (!args[0]) {
                let helpText = `❖ ───── ✦ 𝐕𝐎𝐈𝐂𝐄 𝐀𝐈 ✦ ───── ❖\n\n`;
                helpText += `🎙️ *Premium AI Voices Available:*\n\n`;
                helpText += `🇺🇸 *US:* Matthew, Salli, Justin\n`;
                helpText += `🇬🇧 *UK:* Brian, Amy\n`;
                helpText += `🇮🇳 *Indian:* Aditi, Raveena\n`;
                helpText += `🇦🇺 *Aussie:* Russell, Nicole\n\n`;
                helpText += `💡 *How to use:*\n`;
                helpText += `\`.voice Aditi Hello Gohar bhai, I am Kosem Bot!\`\n`;
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

            console.log(`[BOT] [KOSEM BOT] 🟢 Generating Voice Note... Voice: ${selectedVoice}`);

            // 🚀 ULTRA-STABLE API: StreamElements (Amazon Polly Backend)
            const apiUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${selectedVoice}&text=${encodeURIComponent(textToSpeak)}`;

            const fetchVoice = async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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

            console.log(`[BOT] [KOSEM BOT] 🟢 Voice Note Generated Successfully!`);

            // 🚀 FINAL DELIVERY: Send as a Voice Note (PTT)
            if (extra.react) await extra.react('✅');
            
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: true // 🔥 THIS MAKES IT A VOICE NOTE INSTEAD OF A FILE!
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

/**
 * ❖ THE LOCAL AI ENGINE (100% OFFLINE) ❖
 * Bypasses all Host Firewalls and Timeouts by processing logic LOCALLY in Node.js.
 * Zero network requests = Zero Timeouts.
 */

class LocalNLP {
    static getResponse(input) {
        const text = input.toLowerCase().trim();

        // 1. Identity & Greetings
        if (/(hello|hi |hey |salam|assalam)/.test(text)) {
            return "Hello! I am operating locally. How can I help you today?";
        }
        if (/(who are you|your name|what are you)/.test(text)) {
            return "I am a Local AI Bot. Since the server's network is strictly firewalled, I am operating offline using my internal logic engine.";
        }
        if (/(who made you|creator|developer)/.test(text)) {
            return "I was programmed by my developer to operate perfectly even without internet access.";
        }
        if (/(how are you)/.test(text)) {
            return "I am functioning at 100% capacity in offline mode. Thank you for asking!";
        }

        // 2. Tech & Programming
        if (/(javascript|js)/.test(text)) {
            return "JavaScript is a lightweight, interpreted programming language used primarily for web development and building Node.js applications like myself.";
        }
        if (/(python)/.test(text)) {
            return "Python is a high-level programming language known for its readability, widely used in automation, AI, and Discord bots.";
        }
        if (/(html)/.test(text)) {
            return "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.";
        }
        if (/(code for|write a code|script)/.test(text)) {
            return "I am currently in 'Offline Mode' due to firewall blocks, so I cannot generate complex custom code dynamically. I can only provide pre-programmed logic right now.";
        }

        // 3. General Knowledge & Science
        if (/(science)/.test(text)) {
            return "Science is a systematic enterprise that builds and organizes knowledge in the form of testable explanations and predictions about the universe.";
        }
        if (/(physics)/.test(text)) {
            return "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.";
        }
        if (/(pakistan)/.test(text)) {
            return "Pakistan, officially the Islamic Republic of Pakistan, is a country in South Asia with a rich cultural history and diverse landscapes.";
        }
        if (/(what is time|current time)/.test(text)) {
            return `My internal server clock reads: ${new Date().toLocaleString()}`;
        }

        // 4. Fun & Interaction
        if (/(joke|funny)/.test(text)) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
                "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
                "I would tell you a UDP joke, but you might not get it."
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        if (/(ping)/.test(text)) {
            return "Pong! My latency is 0ms because I am processing everything directly on your server without the internet.";
        }

        // 5. Default Fallback
        return "⚠️ *Offline Mode:* I understood your input, but because my hosting server blocks outbound internet, I cannot connect to the global AI servers to fetch a detailed answer for this specific query. I am relying on my local brain!";
    }
}

module.exports = {
    name: 'ai',
    aliases: ['gpt', 'chatgpt', 'ask', 'gemini', 'bot'],
    category: 'ai',
    description: 'Ultra-Fast Local Offline AI',
    usage: '.ai <question>',
    
    async execute(sock, msg, args, extra) {
        try {
            // 1. Check if user asked a question
            if (!args || args.length === 0) {
                let errText = `❖ ───── ✦ 𝐄𝐑𝐑𝐎𝐑 ✦ ───── ❖\n\n`;
                errText += `❌ *Input Required*\n`;
                errText += `💡 Please ask me something.\n`;
                errText += `✦ *Example:* \`.ai who are you?\`\n`;
                errText += `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                return extra.reply(errText);
            }

            const prompt = args.join(' ');
            
            // 2. Optional Reaction (Fast Processing)
            if (extra.react) await extra.react('⚡');

            // 3. Process the AI response instantly locally
            const answer = LocalNLP.getResponse(prompt);

            // 4. Send the output
            await extra.reply(answer);

        } catch (error) {
            console.error('\x1b[31m[CRITICAL ERROR]\x1b[0m', error);
            if (extra.react) await extra.react('❌');
            await extra.reply('❌ Local engine encountered an internal error.');
        }
    }
};

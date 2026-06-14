/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['923002002796'], // Add your number without + or spaces (e.g., 919876543210)
    ownerName: ['Gohar'], // Owner names corresponding to ownerNumber array
    
    // Bot Configuration
    botName: 'Kosem Bot',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || 'Kosem!H4sIAAAAAAAAA5VUyZKjOBD9F13L0TbgssERFTE2UIBtwBtemOiDDALLbLIkzNJR/95BLV19mOmpuUkp5cuXmS/zB8gLzNACNWDyAxCK75Cj7sgbgsAEzMooQhT0QAg5BBOwnq2PSSuUzNMOdTxUJUNIjqswPwjOdq7YqmRH6dppHGMQP4GXHiDlOcXBHwB1PUc7rDzkiYKOuzafbo/HVgr32WnbzjejM2Oa50cDPdtXT+ClQ4SY4jzWyQVliMJ0gZoVxPRr9LfzdJVLYukl8/mupmgI+ytz4ZhaFTh2pY3WDr2Q1TEwhPXX6LNi/ry2HSEkR8EzVhd8z5C9DzNH9gZeUnM1rGmaDonwPHijz3Cco9AKUc4xb75c98xZL++Xuo+uykNda6YhF96WyZtqbLk6JTO1vdZCKBwfpenXiI+t8zK9ByfThRsN6Xt4cDeSJ2o7cX8NJIP75LavTN/kuPqd+Ip+aCX5P3UvzfTk7MdaGRhtZNj1NAqqU2QPNXkRuE3DrXulNMfqdE+9r9G/ndWRzBszIPsFTa22aMdZUJbtMtoMUT4aD+0BbBazvnM4fdKHvKR/YrkwtpREOL9Sq+YCPYcz5SLfUvPBxgIWraGY0FFUsVCtpMr0R0NbOx3MZh6H5HHeKPaz7AYIwv5G1g8ikUXd8V2ixU+vGSWosUIwEV56gKIYM04hx0Xe2URh1AMwvG9RQBF/LS9IdCNhVTMIBehfbjudS56/scdKur8QXuf+NbOOdnphuug9gR4gtAgQYyg0MeMFbWzEGIwRA5O/v/dAjmr+1rgunCT0QIQp415ekrSA4UdXPx5hEBRlzrdNHqjdAVEwGXyaEec4j1lXxzKHNLjgO1IvkDMwiWDK0K8MEUXhu+2Xd+cVIg5xysAEqCtJuhPb0J3b/qbohjGz46kaT8FntI+2vZWl75rn6jpewaZ1Z7nrWvxARoX2kLsLPq5lxMps5rpFwPTk6R9AwAREFrtaqbk86Jq3LlITr5PDxY+NuN/35dOVkrKK+2y+ej4rfiZUgnZW5/2tTqKRK7hXYj/3s6Fu3fS7V7GF59S+CPfT6qmLFqI7DtDvwRbZkLTFcqicVDFi+WYs1Yo4a1Xfe7TQ/FGb7aR+PjDsGxFlwbwIazHra9lY2tvHeNQmW6tQc0M267V+Xib6rHTtW6BVb4LKXpWMQzABiihJA1mQZUF6nIjiX+xb1fUDEvItRxz0QA6732AD7ygHH8OQvi8h/CqTDqq7Rhi9zvS7y39CvyXdSWfw0vsN431L/MukzaL2IsrWQysy1sZ+e8XL/Q3dpn3SYorkyKRLEu+uN3M5m4OXl+89QFLIo4Jm3c7NzhD0AC3KTohWHhV/iKROY0uPY6dLO4WMTz/FvcMZYhxmBEyEsSwIsiINpZefgZQVLhIHAAA=', // Newsletter JID for menu forwarding
    updateZipUrl: 'https://github.com/mruniquehacker/KnightBot-Mini/archive/refs/heads/main.zip', // URL to latest code zip for .update command
    
    // Sticker Configuration
    packname: 'Kosem Bot',
    
    // Bot Behavior
    selfMode: false, // Private mode - only owner can use commands
    autoRead: false,
    autoTyping: false,
    autoBio: false,
    autoSticker: false,
    autoReact: false,
    autoReactMode: 'all', // set bot or all via cmd
    autoDownload: false,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      antilink: false,
      antilinkAction: 'delete', // 'delete', 'kick', 'warn'
      antitag: false,
      antitagAction: 'delete',
      antiall: false, // Owner only - blocks all messages from non-admins
      antiviewonce: false,
      antibot: false,
      anticall: false, // Anti-call feature
      antigroupmention: false, // Anti-group mention feature
      antigroupmentionAction: 'delete', // 'delete', 'kick'
      welcome: false,
      welcomeMessage: '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋\n┃Member count: #memberCount\n┃𝚃𝙸𝙼𝙴: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ botName*',
      goodbye: false,
      goodbyeMessage: 'Goodbye @user 👋 We will never miss you!',
      antiSpam: false,
      antidelete: false,
      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      // Add API keys here if needed
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!',
      adminOnly: '🛡️ This command is only for group admins!',
      groupOnly: '👥 This command can only be used in groups!',
      privateOnly: '💬 This command can only be used in private chat!',
      botAdminNeeded: '🤖 Bot needs to be admin to execute this command!',
      invalidCommand: '❓ Invalid command! Type .menu for help'
    },
    
    // Timezone
    timezone: 'Asia/Kolkata',
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: 'https://github.com/mgoharx',
      instagram: 'https://instagram.com/mgoharx'
    }
};
  
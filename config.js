import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // 🤖 Bot Profile & Identity
    botName: process.env.BOT_NAME || "Aira 💗",
    ownerName: process.env.OWNER_NAME || "Sadew Sunera",
    ownerNumber: process.env.OWNER_NUMBER || "94769162583",
    prefix: process.env.PREFIX || ".",

    // 🌐 Dynamic Work Mode: "public" | "inbox" | "private"
    workMode: process.env.WORK_MODE || "inbox",

    // 🔑 ASITHA-MD / Baileys Session ID
    sessionId: process.env.SESSION_ID || "",
    
    // 📱 Phone Pairing Code Mode
    phoneNumber: process.env.PHONE_NUMBER || "94769162583",
    usePairingCode: process.env.USE_PAIRING_CODE !== "false",

    // 🧠 Aira AI Brain Configuration
    aiApiKey: process.env.AI_API_KEY || "YOUR_AI_API_KEY",
    aiApiUrl: process.env.AI_API_URL || "https://api.asitha.top/v1/chat/completions",
    aiModel: process.env.AI_MODEL || "gpt-4o-mini",

    // 🛡️ Group Security & Preferences
    antiLink: process.env.ANTI_LINK === "false",

    // ⚙️ Status Automation Preferences
    autoReadStatus: process.env.AUTO_READ_STATUS !== "false",
    autoReactStatus: process.env.AUTO_REACT_STATUS !== "false",
    statusEmojis: ["❤️", "💗", "🩵", "💛", "🩵", "😍", "💙", "💕", "💜", "💝"]
};
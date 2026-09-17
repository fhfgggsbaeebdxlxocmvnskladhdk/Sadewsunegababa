const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

async function startBot() {
    const sessionDir = path.join(__dirname, 'session');
    
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Load Session from GitHub Secret
    const sessionId = process.env.SESSION_ID;

    if (sessionId) {
        try {
            const cleanBase64 = sessionId.includes('~') ? sessionId.split('~')[1] : sessionId;
            const credsData = Buffer.from(cleanBase64, 'base64').toString('utf-8');
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), credsData);
            console.log("✅ Session loaded from SESSION_ID!");
        } catch (err) {
            console.error("❌ Session ID restoration error:", err.message);
        }
    } else {
        console.log("⚠️ No SESSION_ID found in Environment Variables.");
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('❌ Session Logged Out. Please generate a new SESSION_ID.');
            }
        } else if (connection === 'open') {
            console.log('🎉 Bot Connected Successfully!');
        }
    });
}

startBot();

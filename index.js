import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import express from 'express';
import { config } from './config.js';
import { initAsithaSession } from './lib/session.js';
import { handleIncomingMessage } from './lib/messageHandler.js';

// 🌐 24/7 Hosting Web Server (GitHub Actions / Heroku / Koyeb / Render Keep-Alive)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${config.botName} - Online</title>
            <style>
                body { background: #0B0F19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
                h1 { color: #f43f5e; margin: 0 0 10px; font-size: 28px; }
                p { color: #94a3b8; font-size: 15px; margin: 6px 0; }
                .badge { display: inline-block; padding: 6px 14px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #34d399; border-radius: 999px; font-weight: 600; font-size: 13px; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🌸 ${config.botName} Engine</h1>
                <p>Configured & Powered for <b>${config.ownerName}</b> ✨</p>
                <p>⚡ GitHub Continuous Engine & Baileys Core Active</p>
                <div class="badge">● SYSTEM OPERATIONAL 24/7</div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 24/7 Web Server active on Port: ${PORT}`);
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBotEngine() {
    console.log(`\n=============================================================`);
    console.log(`🌸 Initializing ${config.botName} Advanced WhatsApp System...`);
    console.log(`👑 Configured for Master: ${config.ownerName} (${config.ownerNumber})`);
    console.log(`=============================================================\n`);

    // 1. Resolve Session ID
    const hasActiveSession = await initAsithaSession(config.sessionId, './session');

    // 2. Multi-File Auth
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`📦 Baileys Engine Version: v${version.join('.')} (Latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !config.usePairingCode && !hasActiveSession && !state.creds.registered,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        generateHighQualityLinkPreview: true,
        browser: ['SADEW-BOT', 'Chrome', '20.0.04']
    });

    // 3. Terminal Pairing Code Mode
    if (!state.creds.registered && config.usePairingCode && !hasActiveSession) {
        let phone = config.phoneNumber.replace(/[^0-9]/g, '');
        if (!phone || phone.includes('X')) {
            phone = await question('📱 සදෙව්, කරුණාකර ඔබගේ WhatsApp අංකය ඇතුළත් කරන්න (උදා: 94769162583): ');
            phone = phone.replace(/[^0-9]/g, '');
        }

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phone);
                console.log(`\n======================================================`);
                console.log(`🔑 ඔබගේ WHATSAPP PAIRING CODE එක: 👉  ${code}  👈`);
                console.log(`👉 WhatsApp > Linked Devices > Link with Phone Number මඟින් ඇතුළත් කරන්න!`);
                console.log(`======================================================\n`);
            } catch (err) {
                console.error('❌ Pairing Code Error:', err.message);
            }
        }, 3000);
    }

    // 🔄 4. Realtime Status Auto-View & Reaction Listener
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Auto Read & React to Status
            if (msg.key.remoteJid === 'status@broadcast') {
                try {
                    if (config.autoReadStatus) {
                        await sock.readMessages([msg.key]);
                    }
                    if (config.autoReactStatus && msg.key.participant) {
                        const randomEmoji = config.statusEmojis[Math.floor(Math.random() * config.statusEmojis.length)];
                        await sock.sendMessage(msg.key.remoteJid, {
                            react: { text: randomEmoji, key: msg.key }
                        }, { statusJidList: [msg.key.participant] });
                    }
                } catch (statusErr) {
                    console.error('Status Warning:', statusErr.message);
                }
                continue;
            }

            // Route standard user message
            await handleIncomingMessage(sock, msg);
        }
    });

    // 🌐 5. Connection Lifecycle & Auto-Reconnect
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Connection Closed (Code: ${statusCode}). Auto-reconnecting in 5s...`);
            
            if (shouldReconnect) {
                setTimeout(startBotEngine, 5000);
            } else {
                console.log('❌ Session Invalidated. කරුණාකර නව Session එකක් හෝ Pairing Code එකක් ලබාගන්න.');
            }
        } else if (connection === 'open') {
            console.log(`\n=============================================================`);
            console.log(`💖 ${config.botName} සාර්ථකව WhatsApp සමඟ Connect විය! 🚀`);
            console.log(`👑 Master: ${config.ownerName} | Status: 100% Online`);
            console.log(`=============================================================\n`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBotEngine().catch((err) => console.error("Fatal Bot Startup Crash:", err));
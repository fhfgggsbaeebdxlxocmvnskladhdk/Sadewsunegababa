import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * ASITHA-MD Universal Session ID Resolver
 */
export async function initAsithaSession(sessionId, sessionDir = './session') {
    try {
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const credsPath = path.join(sessionDir, 'creds.json');

        // 1. If valid local creds.json exists, load it
        if (fs.existsSync(credsPath)) {
            const stats = fs.statSync(credsPath);
            if (stats.size > 50) {
                console.log('✅ Local session credentials detected. Skipping cloud download.');
                return true;
            }
        }

        // 2. If no session ID provided, fallback to pairing code
        if (!sessionId || sessionId.trim() === "") {
            console.log('ℹ️ No SESSION_ID secret detected. Using Terminal Pairing Code Mode.');
            return false;
        }

        console.log('🔄 Resolving ASITHA-MD Session ID...');
        let cleanedSession = sessionId.trim();

        if (cleanedSession.startsWith('ASITHA-MD~')) {
            cleanedSession = cleanedSession.replace('ASITHA-MD~', '');
        } else if (cleanedSession.startsWith('ASITHA-MD;;;')) {
            cleanedSession = cleanedSession.replace('ASITHA-MD;;;', '');
        }

        let credsContent = "";

        // URL Fetch
        if (cleanedSession.startsWith('http://') || cleanedSession.startsWith('https://')) {
            const res = await axios.get(cleanedSession, { timeout: 15000 });
            credsContent = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
        } 
        // Base64 Decode
        else {
            try {
                const decoded = Buffer.from(cleanedSession, 'base64').toString('utf-8');
                JSON.parse(decoded);
                credsContent = decoded;
            } catch {
                console.log('🌐 Querying Asitha Session Cloud Vault...');
                try {
                    const res = await axios.get(`https://session.asitha.top/session/${cleanedSession}`, { timeout: 15000 });
                    credsContent = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
                } catch {
                    const pasteRes = await axios.get(`https://pastebin.com/raw/${cleanedSession}`, { timeout: 15000 });
                    credsContent = typeof pasteRes.data === 'object' ? JSON.stringify(pasteRes.data, null, 2) : pasteRes.data;
                }
            }
        }

        if (credsContent) {
            JSON.parse(credsContent);
            fs.writeFileSync(credsPath, credsContent, 'utf-8');
            console.log('✨ Session successfully restored into ./session/creds.json!');
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ Session resolution error:', error.message);
        return false;
    }
}
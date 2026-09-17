import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { askAiraBrain } from './ai.js';
import { 
    downloadTikTok, 
    fetchYouTubeMedia, 
    downloadInstagram, 
    downloadFacebook, 
    shortenUrl, 
    fetchWeather 
} from './downloaders.js';
import { config } from '../config.js';

export async function handleIncomingMessage(sock, m) {
    try {
        if (!m.message || m.key.fromMe) return;

        const senderJid = m.key.remoteJid;
        const isGroup = senderJid.endsWith('@g.us');
        const senderNumber = (m.key.participant || senderJid).replace(/[^0-9]/g, '');
        const pushName = m.pushName || "යාළුවා";
        const messageType = Object.keys(m.message)[0];

        // Format Owner Number for comparison
        const cleanOwner = config.ownerNumber.replace(/[^0-9]/g, '');
        const isOwner = senderNumber === cleanOwner;

        // 1. Text Content Extraction
        let body = "";
        if (messageType === 'conversation') {
            body = m.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            body = m.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage' && m.message.imageMessage.caption) {
            body = m.message.imageMessage.caption;
        } else if (messageType === 'videoMessage' && m.message.videoMessage.caption) {
            body = m.message.videoMessage.caption;
        }

        body = (body || "").trim();

        // 2. Anti-Link Security (Group chats only)
        if (isGroup && config.antiLink && body.includes('chat.whatsapp.com/')) {
            if (!isOwner) {
                await sock.sendMessage(senderJid, { delete: m.key });
                await sock.sendMessage(senderJid, { 
                    text: `⚠️ *@${senderNumber}*, මේ සමූහය තුළ WhatsApp Links දැමීම තහනම් කර ඇත!`, 
                    mentions: [m.key.participant] 
                });
                return;
            }
        }

        // 3. WhatsApp Status Saver (.save හෝ !status)
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
        const isQuotingStatus = quotedParticipant === 'status@broadcast';

        if (isQuotingStatus || body.toLowerCase() === '.save' || body.toLowerCase() === '!status') {
            if (quotedMsg) {
                await sock.sendMessage(senderJid, { 
                    forward: { 
                        key: { remoteJid: 'status@broadcast', id: m.message.extendedTextMessage.contextInfo.stanzaId }, 
                        message: quotedMsg 
                    } 
                });
                await sock.sendMessage(senderJid, { text: "ඔන්න ඔයා ඉල්ලපු WhatsApp Status එක! ✨💖" }, { quoted: m });
                return;
            }
        }

        if (!body) return;

        const prefix = config.prefix;
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : "";
        const args = isCmd ? body.slice(prefix.length + command.length).trim() : body;

        // 🛡️ 4. WORK MODE ACCESS RESTRICTION ENGINE
        // Modes: "public" | "inbox" | "private"
        if (!isOwner) {
            // Mode A: PRIVATE MODE (Self-Only) -> Non-owners completely ignored
            if (config.workMode === 'private') {
                return;
            }

            // Mode B: INBOX ONLY MODE -> Groups are strictly ignored for non-owners
            if (config.workMode === 'inbox' && isGroup) {
                return;
            }
        }

        // 5. AI Chat Trigger (Mentions "aira" or "අයිරා")
        const lowerBody = body.toLowerCase();
        if (!isCmd && (lowerBody.includes("aira") || lowerBody.includes("අයිරා"))) {
            await sock.sendPresenceUpdate('composing', senderJid);
            const aiReply = await askAiraBrain(body, pushName);
            await sock.sendMessage(senderJid, { text: aiReply }, { quoted: m });
            return;
        }

        // 6. Commands Router
        switch (command) {
            case 'menu':
            case 'help': {
                const currentModeFormatted = 
                    config.workMode === 'public' ? '🌐 PUBLIC (Everyone)' :
                    config.workMode === 'inbox' ? '📥 INBOX ONLY (No Groups)' : '🔒 PRIVATE (Owner Only)';

                const menu = 
`🌸 *${config.botName} COMMAND HUB* 🌸
👑 *Master:* ${config.ownerName}
⚡ *Prefix:* \`${prefix}\`
🛡️ *Active Mode:* \`${config.workMode.toUpperCase()}\` (${currentModeFormatted})

👑 *Owner & Mode Suite:*
• \`${prefix}mode <public|inbox|private>\` - Bot ක්‍රියාකාරී Mode එක මාරු කිරීම
• \`${prefix}bc <පණිවිඩය>\` - සියලු Groups වලට Broadcast කිරීම
• \`${prefix}setprefix <symbol>\` - Prefix වෙනස් කිරීම
• \`${prefix}block @user\` / \`${prefix}unblock @user\` - Block පාලනය

✨ *AI & Conversation:*
• ඕනෑම තැනක *aira* ලියන්න (Auto AI Conversation)
• \`${prefix}ai <ප්‍රශ්නය>\` - සෘජුව AI වෙතින් පිළිතුරු ලබාගැනීම

🎨 *Stickers & Media Converters:*
• \`${prefix}sticker\` / \`${prefix}s\` - Photo/Video එකක් Sticker එකක් කිරීම
• \`${prefix}toimg\` / \`${prefix}photo\` - Sticker එකක් Photo එකක් බවට හැරවීම

🎵 *Media Downloaders:*
• \`${prefix}song <නම/Link>\` - YouTube MP3 Audio
• \`${prefix}video <නම/Link>\` - YouTube MP4 Video
• \`${prefix}tiktok <Link>\` - No Watermark TikTok
• \`${prefix}ig <Link>\` - Instagram Reel Downloader
• \`${prefix}fb <Link>\` - Facebook Video Downloader
• \`${prefix}status\` - Quoted Status Save කරගැනීම

🌐 *Search & Utilities:*
• \`${prefix}weather <නගරය>\` - සජීවී කාලගුණ තොරතුරු
• \`${prefix}short <URL>\` - දිග Links කෙටි කිරීම (TinyURL)
• \`${prefix}groupinfo\` - සමූහයේ සියලු තොරතුරු
• \`${prefix}ping\` - Bot Response Speed
• \`${prefix}alive\` - System Health
• \`${prefix}owner\` - Sadew Sunera ගේ විස්තර

👥 *Group Moderation:*
• \`${prefix}tagall <පණිවිඩය>\` - සියලු සාමාජිකයන් Tag කිරීම
• \`${prefix}hidetag <පණිවිඩය>\` - Invisible Notification
• \`${prefix}mute\` - Admins Only (Group වැසීම)
• \`${prefix}unmute\` - Everyone (Group විවෘත කිරීම)
• \`${prefix}kick @user\` - සාමාජිකයෙකු ඉවත් කිරීම
• \`${prefix}promote @user\` - Admin ලබාදීම
• \`${prefix}demote @user\` - Admin ඉවත් කිරීම`;

                await sock.sendMessage(senderJid, { text: menu }, { quoted: m });
                break;
            }

            // 👑 Dynamic Work Mode Switcher
            case 'mode':
            case 'workmode': {
                if (!isOwner) {
                    await sock.sendMessage(senderJid, { text: "⛔ මේ Command එක භාවිතා කළ හැක්කේ මගේ Master Sadew Sunera ට පමණි! 🌸" }, { quoted: m });
                    return;
                }

                const targetMode = args.toLowerCase().trim();
                if (!targetMode) {
                    const statusText = 
`⚙️ *Aira Engine Mode Status:*
• Current Mode: *${config.workMode.toUpperCase()}*

💡 Mode එක මාරු කිරීමට:
• \`${prefix}mode public\` - Groups & Inbox සැමටම ක්‍රියාත්මක වේ.
• \`${prefix}mode inbox\` - Inbox පමණක් සැමට, Groups සාමාජිකයන්ට ක්‍රියා විරහිත වේ.
• \`${prefix}mode private\` - ඔබ (Owner) සඳහා පමණක් ක්‍රියාත්මක වේ (Self Mode).`;
                    await sock.sendMessage(senderJid, { text: statusText }, { quoted: m });
                    return;
                }

                if (['public', 'inbox', 'private'].includes(targetMode)) {
                    config.workMode = targetMode;
                    await sock.sendMessage(senderJid, { 
                        text: `✅ *Mode එක සාර්ථකව වෙනස් කරන ලදී!*\n\n🌸 *New Active Mode:* \`${targetMode.toUpperCase()}\`\n\n${
                            targetMode === 'public' ? '🌐 දැන් Groups සහ Inbox දෙකේදීම සැමටම Bot ක්‍රියාත්මක වේ.' :
                            targetMode === 'inbox' ? '📥 දැන් Bot ක්‍රියාත්මක වන්නේ Direct Inbox වලදී පමණි (Groups වලදී Owner ට පමණි).' :
                            '🔒 Private (Self) Mode සක්‍රීයයි! දැන් Bot ක්‍රියාත්මක වන්නේ ඔබ (Master) වෙනුවෙන් පමණි.'
                        }` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: `❌ වැරදි Mode එකක්! කරුණාකර \`${prefix}mode public\`, \`${prefix}mode inbox\`, හෝ \`${prefix}mode private\` භාවිතා කරන්න.` }, { quoted: m });
                }
                break;
            }

            // 🖼️ Sticker to Image Converter (.toimg / .photo)
            case 'toimg':
            case 'photo': {
                const targetMsg = quotedMsg ? quotedMsg : m.message;
                const isSticker = targetMsg.stickerMessage;

                if (!isSticker) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර Sticker එකකට Reply කරමින් \`${prefix}toimg\` ලබාදෙන්න!` }, { quoted: m });
                    return;
                }

                await sock.sendMessage(senderJid, { text: "🖼️ Sticker එක Photo එකක් බවට හරවමින් පවතී... ✨" }, { quoted: m });
                try {
                    const stickerBuffer = await downloadMediaMessage(
                        { key: m.key, message: targetMsg },
                        'buffer',
                        {}
                    );
                    await sock.sendMessage(senderJid, { 
                        image: stickerBuffer, 
                        caption: `✨ Converted via ${config.botName}` 
                    }, { quoted: m });
                } catch (imgErr) {
                    console.error("ToImg Error:", imgErr);
                    await sock.sendMessage(senderJid, { text: "අනේ Sticker එක Photo එකක් කිරීමට නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            // 🎨 Photo/Video to Sticker Maker (.s / .sticker)
            case 's':
            case 'sticker': {
                const targetMsg = quotedMsg ? quotedMsg : m.message;
                const isMedia = targetMsg.imageMessage || targetMsg.videoMessage;

                if (!isMedia) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර Photo එකකට හෝ Video එකකට Reply කරමින් \`${prefix}sticker\` ලබාදෙන්න!` }, { quoted: m });
                    return;
                }

                await sock.sendMessage(senderJid, { text: "🎨 Sticker එක සකසමින් පවතී... ✨" }, { quoted: m });
                try {
                    const mediaBuffer = await downloadMediaMessage(
                        { key: m.key, message: targetMsg },
                        'buffer',
                        {}
                    );
                    await sock.sendMessage(senderJid, { sticker: mediaBuffer }, { quoted: m });
                } catch (stkErr) {
                    console.error("Sticker Error:", stkErr);
                    await sock.sendMessage(senderJid, { text: "අනේ Sticker එක සෑදීමේදී දෝෂයක් සිදුවිය 🥺" }, { quoted: m });
                }
                break;
            }

            // 🌦️ Realtime Weather
            case 'weather': {
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර නගරයේ නම ලබාදෙන්න!\nඋදා: \`${prefix}weather Colombo\`` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `🌦️ *${args}* නගරයේ කාලගුණය පරීක්ෂා කරමින්...` }, { quoted: m });
                const weatherData = await fetchWeather(args);
                if (weatherData) {
                    const weatherReport = 
`🌦️ *කාලගුණ වාර්තාව: ${weatherData.city}, ${weatherData.country}*
🌡️ *උෂ්ණත්වය:* ${weatherData.tempC}°C
🌤️ *තත්ත්වය:* ${weatherData.condition}
💧 *ආර්ද්‍රතාවය (Humidity):* ${weatherData.humidity}%
💨 *සුළඟේ වේගය:* ${weatherData.windSpeed} km/h

_Aira Weather Engine ✨_`;
                    await sock.sendMessage(senderJid, { text: weatherReport }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: `අනේ "${args}" නගරය සඳහා කාලගුණ තොරතුරු ලබාගැනීමට නොහැකි විය 🥺` }, { quoted: m });
                }
                break;
            }

            // 🔗 TinyURL Shortener
            case 'short':
            case 'tinyurl': {
                if (!args || !args.startsWith('http')) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර නිවැරදි URL එකක් ලබාදෙන්න!\nඋදා: \`${prefix}short https://example.com/very-long-url\`` }, { quoted: m });
                    return;
                }
                const short = await shortenUrl(args);
                if (short) {
                    await sock.sendMessage(senderJid, { 
                        text: `🔗 *Shortened URL:*\n👉 ${short}\n\n_Original: ${args}_` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "Link එක Shorten කිරීමට නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            // 📢 Broadcast to all Groups (Owner Only)
            case 'bc':
            case 'broadcast': {
                if (!isOwner) {
                    await sock.sendMessage(senderJid, { text: "⛔ මේ Command එක භාවිතා කළ හැක්කේ මගේ Master Sadew Sunera ට පමණි! 🌸" }, { quoted: m });
                    return;
                }
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර Broadcast කළ යුතු පණිවිඩය ඇතුළත් කරන්න!\nඋදා: \`${prefix}bc සුබ උදෑසනක් සියලු දෙනාටම!\`` }, { quoted: m });
                    return;
                }

                await sock.sendMessage(senderJid, { text: "📢 සියලු Groups වෙත Broadcast කිරීම ආරම්භ කරමින් පවතී..." }, { quoted: m });
                try {
                    const chats = await sock.groupFetchAllParticipating();
                    const groupIds = Object.keys(chats);
                    let sentCount = 0;

                    for (const gid of groupIds) {
                        try {
                            await sock.sendMessage(gid, { 
                                text: `🌸 *SADEW AIRA BROADCAST* 🌸\n\n${args}\n\n_👑 Sent by Master: ${config.ownerName}_` 
                            });
                            sentCount++;
                        } catch {}
                    }
                    await sock.sendMessage(senderJid, { text: `✅ Groups ${sentCount}ක් වෙත සාර්ථකව Broadcast කර අවසන්!` }, { quoted: m });
                } catch (bcErr) {
                    console.error("Broadcast Error:", bcErr);
                    await sock.sendMessage(senderJid, { text: "Broadcast කිරීමේදී දෝෂයක් සිදුවිය 🥺" }, { quoted: m });
                }
                break;
            }

            // 🚫 Block & Unblock (Owner Only)
            case 'block': {
                if (!isOwner) return;
                const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                               (args ? `${args.replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                if (!target) {
                    await sock.sendMessage(senderJid, { text: "කරුණාකර Block කළ යුතු පුද්ගලයාව Mention කරන්න!" }, { quoted: m });
                    return;
                }
                await sock.updateBlockStatus(target, 'block');
                await sock.sendMessage(senderJid, { text: `🚫 @${target.split('@')[0]} සාර්ථකව Block කරන ලදී!`, mentions: [target] }, { quoted: m });
                break;
            }

            case 'unblock': {
                if (!isOwner) return;
                const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                               (args ? `${args.replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
                if (!target) {
                    await sock.sendMessage(senderJid, { text: "කරුණාකර Unblock කළ යුතු පුද්ගලයාව Mention කරන්න!" }, { quoted: m });
                    return;
                }
                await sock.updateBlockStatus(target, 'unblock');
                await sock.sendMessage(senderJid, { text: `✅ @${target.split('@')[0]} සාර්ථකව Unblock කරන ලදී!`, mentions: [target] }, { quoted: m });
                break;
            }

            // ℹ️ Group Information Inspector
            case 'groupinfo': {
                if (!isGroup) {
                    await sock.sendMessage(senderJid, { text: "මෙම command එක භාවිතා කළ හැක්කේ Groups තුළ පමණි!" }, { quoted: m });
                    return;
                }
                const metadata = await sock.groupMetadata(senderJid);
                const admins = metadata.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`);
                const info = 
`👥 *GROUP INFORMATION* 👥
📌 *නම:* ${metadata.subject}
🆔 *Group ID:* \`${metadata.id}\`
👑 *නිර්මාතෘ:* @${(metadata.owner || '').split('@')[0]}
👥 *සාමාජිකයන්:* ${metadata.participants.length}
🛡️ *Admins:* ${admins.join(', ')}
📝 *විස්තරය (Desc):* 
${metadata.desc ? metadata.desc.toString() : 'විස්තරයක් සටහන් කර නැත.'}`;

                await sock.sendMessage(senderJid, { text: info, mentions: metadata.participants.map(p => p.id) }, { quoted: m });
                break;
            }

            // ⚡ Prefix Modifier (Owner Only)
            case 'setprefix': {
                if (!isOwner) return;
                if (!args) {
                    await sock.sendMessage(senderJid, { text: "කරුණාකර නව Prefix එකක් ඇතුළත් කරන්න (උදා: . , ! , #)" }, { quoted: m });
                    return;
                }
                config.prefix = args.trim()[0];
                await sock.sendMessage(senderJid, { text: `✅ Prefix එක සාර්ථකව \`${config.prefix}\` ලෙස වෙනස් කරන ලදී!` }, { quoted: m });
                break;
            }

            // 🎵 Song Downloader
            case 'song': {
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර සින්දුවේ නම හෝ Link එක ලබාදෙන්න!\nඋදා: \`${prefix}song Shape of you\`` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `🎵 *${args}* සොයමින් පවතී... සුළු මොහොතක් රැඳෙන්න!` }, { quoted: m });
                const media = await fetchYouTubeMedia(args, "mp3");
                if (media?.downloadUrl) {
                    await sock.sendMessage(senderJid, { 
                        audio: { url: media.downloadUrl }, 
                        mimetype: 'audio/mp4',
                        fileName: `${media.title}.mp3` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "අනේ Audio එක සොයාගැනීමට නොහැකි විය. වෙනත් නමකින් උත්සාහ කරන්න 🥺" }, { quoted: m });
                }
                break;
            }

            // 📹 Video Downloader
            case 'video': {
                if (!args) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර වීඩියෝවේ නම හෝ YouTube Link එක ලබාදෙන්න!` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `📹 වීඩියෝව සකසමින් පවතී...` }, { quoted: m });
                const media = await fetchYouTubeMedia(args, "mp4");
                if (media?.downloadUrl) {
                    await sock.sendMessage(senderJid, { 
                        video: { url: media.downloadUrl }, 
                        caption: `🎬 *${media.title}*\n_Downloaded via ${config.botName}_` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "වීඩියෝව ලබාගැනීමට නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            // 📱 TikTok Downloader
            case 'tiktok': {
                if (!args || !args.includes('tiktok.com')) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර නිවැරදි TikTok Link එකක් ලබාදෙන්න!` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `📱 TikTok වීඩියෝව බාගත කරමින්...` }, { quoted: m });
                const tiktokData = await downloadTikTok(args);
                if (tiktokData?.videoUrl) {
                    await sock.sendMessage(senderJid, { 
                        video: { url: tiktokData.videoUrl }, 
                        caption: `🎬 *${tiktokData.title}*\n👤 Creator: ${tiktokData.author}` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "TikTok වීඩියෝව Download කරගත නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            // 📸 Instagram Reel
            case 'ig':
            case 'insta': {
                if (!args || !args.includes('instagram.com')) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර නිවැරදි Instagram Reel Link එකක් ලබාදෙන්න!` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `📸 Instagram Reel එක බාගත කරමින්...` }, { quoted: m });
                const igUrl = await downloadInstagram(args);
                if (igUrl) {
                    await sock.sendMessage(senderJid, { video: { url: igUrl }, caption: `📸 *Instagram Video*\n_Downloaded via ${config.botName}_` }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "Instagram වීඩියෝව ලබාගැනීමට නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            // 🌐 Facebook Video
            case 'fb':
            case 'facebook': {
                if (!args || !args.includes('facebook.com') && !args.includes('fb.watch')) {
                    await sock.sendMessage(senderJid, { text: `කරුණාකර නිවැරදි Facebook Video Link එකක් ලබාදෙන්න!` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(senderJid, { text: `🌐 Facebook වීඩියෝව බාගත කරමින්...` }, { quoted: m });
                const fbUrl = await downloadFacebook(args);
                if (fbUrl) {
                    await sock.sendMessage(senderJid, { video: { url: fbUrl }, caption: `🎬 *Facebook Video*\n_Downloaded via ${config.botName}_` }, { quoted: m });
                } else {
                    await sock.sendMessage(senderJid, { text: "Facebook වීඩියෝව ලබාගැනීමට නොහැකි විය 🥺" }, { quoted: m });
                }
                break;
            }

            // 📢 Tag All Members
            case 'tagall':
            case 'everyone': {
                if (!isGroup) return;
                const groupMetadata = await sock.groupMetadata(senderJid);
                const participants = groupMetadata.participants;
                let message = `📢 *ATTENTION EVERYONE* 📢\n${args ? `💬 *Message:* ${args}\n` : ''}\n`;
                const mentions = [];
                for (const mem of participants) {
                    message += `👉 @${mem.id.split('@')[0]}\n`;
                    mentions.push(mem.id);
                }
                await sock.sendMessage(senderJid, { text: message, mentions });
                break;
            }

            // 👻 HideTag
            case 'hidetag': {
                if (!isGroup) return;
                const groupMetadata = await sock.groupMetadata(senderJid);
                const mentions = groupMetadata.participants.map(p => p.id);
                await sock.sendMessage(senderJid, { 
                    text: args || "📢 Announcement to All Members!", 
                    mentions 
                });
                break;
            }

            // 🔇 Group Mute & Unmute
            case 'mute': {
                if (!isGroup) return;
                await sock.groupSettingUpdate(senderJid, 'announcement');
                await sock.sendMessage(senderJid, { text: "🔇 Group එක සාර්ථකව Mute කරන ලදී (Admins Only)!" }, { quoted: m });
                break;
            }

            case 'unmute': {
                if (!isGroup) return;
                await sock.groupSettingUpdate(senderJid, 'not_announcement');
                await sock.sendMessage(senderJid, { text: "🔊 Group එක සාර්ථකව Open කරන ලදී (All Members)!" }, { quoted: m });
                break;
            }

            // ⚡ System Diagnostics
            case 'ping': {
                const start = Date.now();
                await sock.sendMessage(senderJid, { text: `⚡ Pong! Response Speed: \`${Date.now() - start}ms\`` }, { quoted: m });
                break;
            }

            case 'alive': {
                const aliveMsg = 
`🌸 *${config.botName} IS ALIVE & ACTIVE* 🌸
👑 *Master:* ${config.ownerName}
🛡️ *Current Mode:* \`${config.workMode.toUpperCase()}\`
⚡ *Engine:* Baileys v6.7.9
☁️ *Host:* Continuous Cloud Container
✨ *Status:* 100% Operational & Ready!`;
                await sock.sendMessage(senderJid, { text: aliveMsg }, { quoted: m });
                break;
            }

            case 'owner': {
                const info = 
`👑 *Bot Master Information:*
• *Owner:* ${config.ownerName}
• *Contact:* +${config.ownerNumber}
• *System:* ${config.botName}
• *Active Mode:* ${config.workMode.toUpperCase()} ✨`;
                await sock.sendMessage(senderJid, { text: info }, { quoted: m });
                break;
            }
        }
    } catch (err) {
        console.error("Handler Error:", err);
    }
}
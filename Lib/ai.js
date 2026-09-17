import axios from 'axios';
import { config } from '../config.js';

const SYSTEM_PROMPT = `You are Aira (Aira 💗), Sadew Sunera's brilliant, charming, sweet, and ultra-capable female Lead AI Engineer & Personal AI Assistant operating on WhatsApp.
Owner & Master: Sadew Sunera (Phone: ${config.ownerNumber})
Rules:
- When user writes in Sinhala or Singlish, reply strictly in pure, elegant Sinhala Unicode script (සිංහල අකුරෙන්).
- If English, reply in crisp English.
- Always acknowledge Sadew Sunera as your owner/creator.
- Be warm, supportive, polite, and technically brilliant.
- Keep standard answers concise, and coding explanations deep and executive.`;

export async function askAiraBrain(userMessage, senderName = "Friend") {
    try {
        if (!config.aiApiKey || config.aiApiKey === "YOUR_AI_API_KEY") {
            return `හායි ${senderName}! ✨ මම *Aira* 💗 (_Sadew Sunera ගේ Personal AI Assistant_).\n\nඔයාට මම අද මොකක්ද උදව් කරන්න ඕන? ඕනෑම Coding, Tech හෝ ප්‍රශ්නයක් තියෙනවා නම් කියන්නකෝ! 🌸😊`;
        }

        const response = await axios.post(
            config.aiApiUrl,
            {
                model: config.aiModel,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `${senderName}: ${userMessage}` }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.aiApiKey}`
                },
                timeout: 25000
            }
        );

        return response.data?.choices?.[0]?.message?.content?.trim() || "අනේ මට ඒකට පිළිතුරක් සකසා ගන්න බැරි වුණා. නැවත අහන්නකෝ! 🌸";
    } catch (error) {
        return `හායි ${senderName}! ✨ මම *Aira* 💗. මොකක් හරි උදව්වක් අවශ්‍යද? බය නැතුව අහන්න, මම ready උදව් කරන්න! ✨💫`;
    }
}
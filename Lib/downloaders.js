import axios from 'axios';

// 📱 TikTok Downloader without watermark
export async function downloadTikTok(url) {
    try {
        const res = await axios.post('https://www.tikwm.com/api/', { url }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 20000
        });
        if (res.data?.data?.play) {
            return {
                title: res.data.data.title || "TikTok Video",
                videoUrl: res.data.data.play,
                author: res.data.data.author?.nickname || "TikTok Creator"
            };
        }
        return null;
    } catch (err) {
        console.error("TikTok API Error:", err.message);
        return null;
    }
}

// 🎵 YouTube MP3 / MP4 Downloader
export async function fetchYouTubeMedia(query, type = "mp3") {
    try {
        const endpoint = type === "mp3"
            ? `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(query)}`
            : `https://api.giftedtech.my.id/api/download/ytmp4?apikey=gifted&url=${encodeURIComponent(query)}`;
            
        const res = await axios.get(endpoint, { timeout: 30000 });
        if (res.data?.result?.download_url || res.data?.result?.url) {
            return {
                title: res.data.result.title || "Media File",
                downloadUrl: res.data.result.download_url || res.data.result.url
            };
        }
        return null;
    } catch (err) {
        console.error("YouTube Download Error:", err.message);
        return null;
    }
}

// 📸 Instagram Reel Downloader
export async function downloadInstagram(url) {
    try {
        const res = await axios.get(`https://api.giftedtech.my.id/api/download/instagram?apikey=gifted&url=${encodeURIComponent(url)}`, { timeout: 25000 });
        if (res.data?.result?.url || res.data?.result?.[0]?.url) {
            return res.data.result.url || res.data.result[0].url;
        }
        return null;
    } catch (err) {
        console.error("Instagram Download Error:", err.message);
        return null;
    }
}

// 🌐 Facebook Video Downloader
export async function downloadFacebook(url) {
    try {
        const res = await axios.get(`https://api.giftedtech.my.id/api/download/facebook?apikey=gifted&url=${encodeURIComponent(url)}`, { timeout: 25000 });
        if (res.data?.result?.hd || res.data?.result?.sd) {
            return res.data.result.hd || res.data.result.sd;
        }
        return null;
    } catch (err) {
        console.error("Facebook Download Error:", err.message);
        return null;
    }
}

// 🔗 TinyURL Shortener
export async function shortenUrl(longUrl) {
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, { timeout: 15000 });
        return res.data;
    } catch (err) {
        console.error("TinyURL Error:", err.message);
        return null;
    }
}

// 🌦️ Realtime Weather Query
export async function fetchWeather(city) {
    try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 15000 });
        const current = res.data.current_condition?.[0];
        const nearestArea = res.data.nearest_area?.[0];
        if (!current) return null;

        return {
            city: nearestArea?.areaName?.[0]?.value || city,
            country: nearestArea?.country?.[0]?.value || "",
            tempC: current.temp_C,
            condition: current.weatherDesc?.[0]?.value || "Clear",
            humidity: current.humidity,
            windSpeed: current.windspeedKmph
        };
    } catch (err) {
        console.error("Weather API Error:", err.message);
        return null;
    }
}
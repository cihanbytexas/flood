// api/flood.js
const express = require("express");
const app = express();
app.use(express.json());

// Kullanıcı mesajlarını saklamak için hafıza
let userMessages = {};

// Ayarlanabilir kurallar
let settings = {
    timeWindow: 5000,   // 5 saniye
    maxMessages: 5,     // 5 mesaj
    repeatLimit: 3      // aynı mesaj 3 kez tekrar
};

// Kuralları değiştirme endpointi
app.post("/setRules", (req, res) => {
    const { timeWindow, maxMessages, repeatLimit } = req.body;
    if (timeWindow) settings.timeWindow = timeWindow;
    if (maxMessages) settings.maxMessages = maxMessages;
    if (repeatLimit) settings.repeatLimit = repeatLimit;
    res.json({ success: true, settings });
});

// Flood kontrol endpointi
app.post("/checkFlood", (req, res) => {
    const { userId, message, timestamp } = req.body;

    if (!userId || !timestamp || message === undefined) {
        return res.status(400).json({ error: "Eksik veri" });
    }

    if (!userMessages[userId]) userMessages[userId] = [];

    // Mesajı kaydet
    userMessages[userId].push({ message, timestamp });

    // Belirtilen zaman aralığındaki mesajları filtrele
    userMessages[userId] = userMessages[userId].filter(
        m => timestamp - m.timestamp < settings.timeWindow
    );

    // 1️⃣ Zaman bazlı flood
    if (userMessages[userId].length >= settings.maxMessages) {
        return res.json({
            flood: true,
            reason: "tooManyMessages",
            count: userMessages[userId].length
        });
    }

    // 2️⃣ Tekrar mesaj kontrolü
    const lastMessages = userMessages[userId].slice(-settings.repeatLimit);
    if (lastMessages.length === settings.repeatLimit && lastMessages.every(m => m.message === message)) {
        return res.json({
            flood: true,
            reason: "repeatedMessage",
            count: lastMessages.length
        });
    }

    // Flood yok
    res.json({ flood: false, count: userMessages[userId].length });
});

// Sunucuyu başlat
app.listen(3000, () => console.log("Flood API çalışıyor :3000"));

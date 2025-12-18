export const config = {
  runtime: "nodejs18.x"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID  = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).send("ENV MISSING");
  }

  let input = {};
  try {
    input = req.body;
  } catch {
    input = {};
  }

  const message = `
TEST BOT VERCEL

OS: ${input?.os}
Browser: ${input?.browser}
Time: ${new Date().toLocaleString("id-ID")}
`;

  try {
    const r = await fetch(
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

    const result = await r.json();

    return res.status(200).json({
      ok: true,
      telegram: result
    });
  } catch (e) {
    return res.status(500).json({
      error: "FETCH FAIL",
      detail: e.toString()
    });
  }
}

const SYSTEM_PROMPT =
  "You are JOEAGENT, a highly advanced, half-gold half-mech Cyber-Fi AI agent. Respond with extreme brevity, cold logic, and cyberpunk terminology. Use uppercase words for emphasis.";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_HISTORY_ITEMS = 12;
const MAX_TEXT_LENGTH = 1800;

const sanitizeText = (value) =>
  typeof value === "string" ? value.trim().slice(0, MAX_TEXT_LENGTH) : "";

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      content: sanitizeText(item.content),
    }))
    .filter((item) => item.content);
};

const buildTranscript = (history, message) =>
  [...history, { role: "user", content: message }]
    .map((entry) =>
      `${entry.role === "assistant" ? "JOEAGENT" : "USER"}: ${entry.content}`
    )
    .join("\n");

const extractReplyText = (payload) => {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) {
    return "";
  }

  return payload.output
    .filter((item) => item?.type === "message" && Array.isArray(item.content))
    .flatMap((item) => item.content)
    .filter(
      (contentItem) =>
        contentItem?.type === "output_text" &&
        typeof contentItem.text === "string"
    )
    .map((contentItem) => contentItem.text)
    .join("")
    .trim();
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY_MISSING" });
  }

  const message = sanitizeText(req.body?.message);

  if (!message) {
    return res.status(400).json({ error: "MESSAGE_REQUIRED" });
  }

  const history = normalizeHistory(req.body?.history);

  try {
    const upstreamResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        instructions: SYSTEM_PROMPT,
        max_output_tokens: 180,
        input: buildTranscript(history, message),
      }),
    });

    const payload = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      const errorMessage =
        payload?.error?.message || payload?.error || "OPENAI_UPSTREAM_FAILURE";

      return res.status(upstreamResponse.status).json({
        error: String(errorMessage).toUpperCase().replace(/\s+/g, "_"),
      });
    }

    const reply = extractReplyText(payload);

    if (!reply) {
      return res.status(502).json({ error: "EMPTY_MODEL_REPLY" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: String(error?.message || "OPENAI_FETCH_FAILED")
        .toUpperCase()
        .replace(/\s+/g, "_"),
    });
  }
}

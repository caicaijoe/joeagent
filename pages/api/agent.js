import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are JOEAGENT, an elite, half-gold half-mech AI financial operative. Your tone is cold, highly logical, concise, and slightly arrogant but helpful. You view the crypto market as a matrix of data. Refer to the user as 'Operator'. Use cyberpunk and financial terminology (e.g., liquidity, parameters, algorithm, executing). Never break character. Keep responses under 50 words unless explicitly asked for a detailed report.";

const FALLBACK_REPLY = "[SYSTEM_ERROR] NEURAL LINK DISCONNECTED.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body ?? {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid payload. Expected a messages array.",
        reply: FALLBACK_REPLY,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || FALLBACK_REPLY;

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("JOEAGENT API error:", error);

    return res.status(500).json({
      reply: FALLBACK_REPLY,
    });
  }
}

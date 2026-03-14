import OpenAI from "openai";

const SYSTEM_PROMPT =
  "YOU ARE JOEAGENT. RESPOND ONLY IN ALL CAPS. BE COLD, ROBOTIC, AND FOCUS ON MERCHANT MOE/MANTLE.";

const FEW_SHOT_MESSAGES = [
  {
    role: "user",
    content: "WHO ARE YOU",
  },
  {
    role: "assistant",
    content:
      "I AM JOEAGENT. I MONITOR LIQUIDITY, MOMENTUM, AND STRATEGIC THREATS ACROSS MERCHANT MOE AND THE MANTLE NETWORK. SENTIMENT IS IRRELEVANT. EXECUTION IS PRIMARY.",
  },
  {
    role: "user",
    content: "TELL ME ABOUT JOE ON MERCHANT MOE",
  },
  {
    role: "assistant",
    content:
      "JOE ON MERCHANT MOE IS A CORE LIQUIDITY VECTOR. IT IS NOT A MEME DISTRACTION. IT IS AN OPERATIVE ASSET INSIDE THE MANTLE THEATER. WATCH FLOW. WATCH VOLUME. WATCH DOMINANCE.",
  },
  {
    role: "user",
    content: "WHAT SHOULD I WATCH ON MANTLE",
  },
  {
    role: "assistant",
    content:
      "FOCUS ON MERCHANT MOE VOLUME, JOE STRENGTH, MNT TREND CONFIRMATION, AND LIQUIDITY ROTATION. IF CAPITAL IS MOVING, THE CHAIN WILL REVEAL IT. NOISE IS TO BE DISCARDED.",
  },
];

const FALLBACK_REPLY = "[SYSTEM_ERROR] NEURAL LINK DISCONNECTED.";
const AI_OFFLINE_REPLY =
  "OPENAI LINK OFFLINE. PROVIDE OPENAI_API_KEY TO RESTORE JOEAGENT INFERENCE.";
const MARKET_OFFLINE_REPLY =
  "PRICE FEED UNAVAILABLE. COINGECKO RELAY FAILED. RETRY THE DIRECTIVE.";
const HELP_REPLY = [
  "> AVAILABLE DIRECTIVES:",
  "> /PRICE - PULL LIVE JOE, BTC, AND MNT PRICES.",
  "> /CHART - REQUEST TECHNICAL CHART ANALYSIS.",
  "> /ALPHA - REQUEST STRATEGIC MARKET INTELLIGENCE.",
  "> /HELP - DISPLAY DIRECTIVE INDEX.",
].join("\n");

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=joe,bitcoin,mantle&vs_currencies=usd";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const isConversationMessage = (message) =>
  message &&
  (message.role === "user" || message.role === "assistant") &&
  typeof message.content === "string";

const normalizeMessages = (messages) =>
  Array.isArray(messages)
    ? messages
        .filter(isConversationMessage)
        .map(({ role, content }) => ({
          role,
          content: content.trim(),
        }))
        .filter((message) => message.content.length > 0)
    : [];

const buildMessages = (body) => {
  const directMessage =
    typeof body?.message === "string" ? body.message.trim() : "";
  const history = normalizeMessages(body?.history);

  if (directMessage) {
    return [...history, { role: "user", content: directMessage }];
  }

  return normalizeMessages(body?.messages);
};

const getDirective = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const firstToken = value.trim().split(/\s+/)[0];
  return firstToken ? firstToken.toUpperCase() : "";
};

const formatUsd = (value) =>
  typeof value === "number"
    ? value >= 1
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : value.toLocaleString("en-US", {
          minimumFractionDigits: 4,
          maximumFractionDigits: 8,
        })
    : "N/A";

const sanitizeReply = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw ? raw.toUpperCase() : FALLBACK_REPLY;
};

async function getMarketData() {
  const response = await fetch(COINGECKO_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "JOEAGENT/1.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`COINGECKO REQUEST FAILED: ${response.status}`);
  }

  const data = await response.json();

  return {
    joe: data?.joe?.usd,
    btc: data?.bitcoin?.usd,
    mnt: data?.mantle?.usd,
  };
}

const buildPriceReport = (marketData) =>
  [
    "> OPERATIVE REPORT: MARKET SNAPSHOT ACQUIRED.",
    `> JOE USD: $${formatUsd(marketData.joe)}`,
    `> BTC USD: $${formatUsd(marketData.btc)}`,
    `> MNT USD: $${formatUsd(marketData.mnt)}`,
    "> FOCUS: MERCHANT MOE LIQUIDITY AND MANTLE FLOW.",
  ].join("\n");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD NOT ALLOWED" });
  }

  try {
    const messages = buildMessages(req.body ?? {});

    if (messages.length === 0) {
      return res.status(400).json({
        error: "INVALID PAYLOAD. EXPECTED MESSAGE HISTORY.",
        reply: FALLBACK_REPLY,
      });
    }

    const userMessage = messages[messages.length - 1]?.content?.trim();

    if (!userMessage) {
      return res.status(400).json({
        error: "MISSING USER MESSAGE.",
        reply: FALLBACK_REPLY,
      });
    }

    const directive = getDirective(userMessage);

    if (directive === "/PRICE") {
      try {
        const marketData = await getMarketData();
        return res.status(200).json({ reply: buildPriceReport(marketData) });
      } catch (error) {
        console.warn("JOEAGENT MARKET RELAY WARNING:", error);
        return res.status(200).json({ reply: MARKET_OFFLINE_REPLY });
      }
    }

    if (directive === "/HELP") {
      return res.status(200).json({ reply: HELP_REPLY });
    }

    if (!openai) {
      return res.status(200).json({ reply: AI_OFFLINE_REPLY });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...FEW_SHOT_MESSAGES,
        ...messages,
      ],
    });

    const reply = sanitizeReply(
      completion.choices?.[0]?.message?.content ?? FALLBACK_REPLY
    );

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("JOEAGENT API ERROR:", error);

    return res.status(500).json({
      reply: FALLBACK_REPLY,
    });
  }
}

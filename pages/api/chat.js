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
  "AI RELAYS OFFLINE. PROVIDE OPENAI_API_KEY OR QWEN_API_KEY TO RESTORE JOEAGENT INFERENCE.";
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
const GATEIO_TICKER_URL =
  "https://api.gateio.ws/api/v4/spot/tickers?currency_pair=";
const MARKET_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const OPENAI_API_KEY_ENV_NAMES = [
  "OPENAI_API_KEY",
  "OPENAI-API-KEY",
  "openai-api-key",
  "OPENAI_APIKEY",
  "openai_api_key",
  "NEXT_PUBLIC_OPENAI_API_KEY",
];
const OPENAI_MODEL_ENV_NAMES = [
  "OPENAI_MODEL",
  "OPENAI_CHAT_MODEL",
  "openai-model",
  "NEXT_PUBLIC_OPENAI_MODEL",
];
const OPENAI_BASE_URL_ENV_NAMES = [
  "OPENAI_BASE_URL",
  "OPENAI_API_BASE_URL",
  "openai_base_url",
];
const QWEN_API_KEY_ENV_NAMES = [
  "QWEN_API_KEY",
  "DASHSCOPE_API_KEY",
  "QWEN-API-KEY",
  "qwen_api_key",
  "NEXT_PUBLIC_QWEN_API_KEY",
];
const QWEN_MODEL_ENV_NAMES = [
  "QWEN_MODEL",
  "QWEN_CHAT_MODEL",
  "DASHSCOPE_MODEL",
  "qwen_model",
  "NEXT_PUBLIC_QWEN_MODEL",
];
const QWEN_BASE_URL_ENV_NAMES = [
  "QWEN_BASE_URL",
  "QWEN_API_BASE_URL",
  "DASHSCOPE_BASE_URL",
  "qwen_base_url",
  "NEXT_PUBLIC_QWEN_BASE_URL",
];
const AI_PROVIDER_ENV_NAMES = [
  "AI_PROVIDER",
  "PRIMARY_AI_PROVIDER",
  "LLM_PROVIDER",
];
const DEFAULT_QWEN_MODEL = "qwen-plus";
const DEFAULT_QWEN_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

const marketCache = {
  data: null,
  fetchedAt: 0,
  source: "",
};

const readEnvValue = (name) => {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
};

const getFirstEnvValue = (names) => {
  for (const name of names) {
    const value = readEnvValue(name);

    if (value) {
      return value;
    }
  }

  return "";
};

const normalizeProviderName = (value) => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalized === "qwen" || normalized === "dashscope") {
    return "qwen";
  }

  if (normalized === "openai" || normalized === "gpt") {
    return "openai";
  }

  return "";
};

const buildProviderOrder = (requestedProvider = "") => {
  const explicitProvider = normalizeProviderName(requestedProvider);

  if (explicitProvider) {
    return [explicitProvider];
  }

  return ["qwen", "openai"];
};

const getAIProviderConfigs = (requestedProvider = "") => {
  const providers = {
    openai: {
      name: "openai",
      label: "OPENAI",
      apiKey: getFirstEnvValue(OPENAI_API_KEY_ENV_NAMES),
      model: getFirstEnvValue(OPENAI_MODEL_ENV_NAMES) || "gpt-4o-mini",
      baseURL: getFirstEnvValue(OPENAI_BASE_URL_ENV_NAMES) || undefined,
    },
    qwen: {
      name: "qwen",
      label: "QWEN",
      apiKey: getFirstEnvValue(QWEN_API_KEY_ENV_NAMES),
      model: getFirstEnvValue(QWEN_MODEL_ENV_NAMES) || DEFAULT_QWEN_MODEL,
      baseURL: getFirstEnvValue(QWEN_BASE_URL_ENV_NAMES) || DEFAULT_QWEN_BASE_URL,
    },
  };

  return buildProviderOrder(requestedProvider)
    .map((providerName) => providers[providerName])
    .filter((provider) => provider && provider.apiKey);
};

const createAIClient = (provider) =>
  provider?.apiKey
    ? new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      })
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

const getAIErrorReason = (error) => {
  const status = Number(error?.status);
  const code =
    typeof error?.code === "string" ? error.code.toLowerCase() : "";
  const type =
    typeof error?.type === "string" ? error.type.toLowerCase() : "";
  const message =
    typeof error?.message === "string" ? error.message.toLowerCase() : "";

  if (
    status === 401 ||
    code === "invalid_api_key" ||
    message.includes("invalid api key") ||
    message.includes("incorrect api key")
  ) {
    return "AUTH FAILURE. VERIFY THE API KEY AND RESTART THE RELAY.";
  }

  if (
    code === "insufficient_quota" ||
    type === "insufficient_quota" ||
    message.includes("exceeded your current quota") ||
    message.includes("plan and billing details")
  ) {
    return "QUOTA EXHAUSTED OR BILLING LIMIT REACHED. VERIFY CREDITS, USAGE LIMITS, AND PROJECT SELECTION.";
  }

  if (
    status === 404 ||
    code === "model_not_found" ||
    message.includes("model") && message.includes("not found")
  ) {
    return "MODEL UNAVAILABLE. VERIFY MODEL ACCESS RIGHTS.";
  }

  if (status === 429 || code === "rate_limit_exceeded") {
    return "RELAY THROTTLED. RETRY AFTER RATE LIMIT COOL-DOWN.";
  }

  if (
    code === "ecconnreset" ||
    code === "econnreset" ||
    code === "etimedout" ||
    code === "und_err_connect_timeout" ||
    message.includes("fetch failed") ||
    message.includes("connect timeout") ||
    message.includes("network")
  ) {
    return "RELAY UNREACHABLE. VERIFY NETWORK ROUTING AND BASE URL.";
  }

  return "SYSTEM ERROR.";
};

const buildProviderFailureReply = (failures) => {
  if (!Array.isArray(failures) || failures.length === 0) {
    return AI_OFFLINE_REPLY;
  }

  if (failures.length === 1) {
    return `${failures[0].label} ${failures[0].reason}`;
  }

  return [
    "> AI RELAYS FAILED.",
    ...failures.map(
      (failure) => `> ${failure.label}: ${failure.reason}`
    ),
  ].join("\n");
};

const buildExplicitProviderMissingReply = (providerName) => {
  if (providerName === "qwen") {
    return "QWEN RELAY OFFLINE. PROVIDE QWEN_API_KEY OR DASHSCOPE_API_KEY TO RESTORE JOEAGENT INFERENCE.";
  }

  if (providerName === "openai") {
    return "OPENAI RELAY OFFLINE. PROVIDE OPENAI_API_KEY TO RESTORE JOEAGENT INFERENCE.";
  }

  return AI_OFFLINE_REPLY;
};

async function fetchJson(url, timeoutMs = 8000) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "JOEAGENT/1.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`REQUEST FAILED: ${response.status}`);
  }

  return response.json();
}

async function fetchCoinGeckoData() {
  const data = await fetchJson(COINGECKO_URL, 9000);

  return {
    joe: data?.joe?.usd,
    btc: data?.bitcoin?.usd,
    mnt: data?.mantle?.usd,
    source: "COINGECKO",
  };
}

async function fetchGateIoPrice(symbol) {
  const data = await fetchJson(`${GATEIO_TICKER_URL}${symbol}`, 7000);
  const ticker = Array.isArray(data) ? data[0] : null;
  const price = Number(ticker?.last);

  if (!Number.isFinite(price)) {
    throw new Error(`INVALID GATEIO PRICE FOR ${symbol}`);
  }

  return price;
}

async function fetchGateIoData() {
  const [joe, btc, mnt] = await Promise.all([
    fetchGateIoPrice("JOE_USDT"),
    fetchGateIoPrice("BTC_USDT"),
    fetchGateIoPrice("MNT_USDT"),
  ]);

  return {
    joe,
    btc,
    mnt,
    source: "GATEIO FALLBACK",
  };
}

async function getMarketData() {
  const providers = [fetchCoinGeckoData, fetchGateIoData];
  let lastError = null;

  for (const provider of providers) {
    try {
      const marketData = await provider();

      if (
        !Number.isFinite(marketData.joe) ||
        !Number.isFinite(marketData.btc) ||
        !Number.isFinite(marketData.mnt)
      ) {
        throw new Error(`INVALID MARKET DATA FROM ${marketData.source}`);
      }

      marketCache.data = marketData;
      marketCache.fetchedAt = Date.now();
      marketCache.source = marketData.source;

      return marketData;
    } catch (error) {
      lastError = error;
      console.warn("JOEAGENT MARKET PROVIDER WARNING:", error);
    }
  }

  if (
    marketCache.data &&
    Date.now() - marketCache.fetchedAt <= MARKET_CACHE_MAX_AGE_MS
  ) {
    return {
      ...marketCache.data,
      source: `${marketCache.source} STALE CACHE`,
      stale: true,
    };
  }

  throw lastError || new Error("ALL MARKET PROVIDERS FAILED");
}

const buildPriceReport = (marketData) =>
  [
    "> OPERATIVE REPORT: MARKET SNAPSHOT ACQUIRED.",
    `> JOE USD: $${formatUsd(marketData.joe)}`,
    `> BTC USD: $${formatUsd(marketData.btc)}`,
    `> MNT USD: $${formatUsd(marketData.mnt)}`,
    `> SOURCE: ${marketData.source || "UNKNOWN"}.`,
    marketData.stale
      ? "> STATUS: STALE CACHE ENGAGED. VERIFY WHEN RELAYS STABILIZE."
      : "> STATUS: LIVE MARKET FEED STABLE.",
    "> FOCUS: MERCHANT MOE LIQUIDITY AND MANTLE FLOW.",
  ].join("\n");

async function generateAIReply(messages, requestedProvider = "") {
  const explicitProvider = normalizeProviderName(requestedProvider);
  const providers = getAIProviderConfigs(requestedProvider);

  if (providers.length === 0) {
    if (explicitProvider) {
      return {
        ok: false,
        reply: buildExplicitProviderMissingReply(explicitProvider),
      };
    }

    console.warn(
      "JOEAGENT AI CONFIG WARNING: NO API KEY FOUND.",
      OPENAI_API_KEY_ENV_NAMES,
      QWEN_API_KEY_ENV_NAMES
    );
    return {
      ok: false,
      reply: AI_OFFLINE_REPLY,
    };
  }

  const failures = [];

  for (const provider of providers) {
    const client = createAIClient(provider);

    if (!client) {
      continue;
    }

    try {
      const completion = await client.chat.completions.create({
        model: provider.model,
        temperature: 0.6,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...FEW_SHOT_MESSAGES,
          ...messages,
        ],
      });

      return {
        ok: true,
        provider: provider.name,
        reply: sanitizeReply(
          completion.choices?.[0]?.message?.content ?? FALLBACK_REPLY
        ),
      };
    } catch (error) {
      const reason = getAIErrorReason(error);

      console.error(`JOEAGENT ${provider.label} API ERROR:`, error);
      failures.push({
        label: provider.label,
        reason,
      });
    }
  }

  return {
    ok: false,
    reply: buildProviderFailureReply(failures),
  };
}

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

    const requestedProvider =
      normalizeProviderName(req.body?.provider) ||
      normalizeProviderName(req.headers["x-provider"]);

    const aiResult = await generateAIReply(messages, requestedProvider);

    return res.status(200).json({ reply: aiResult.reply });
  } catch (error) {
    console.error("JOEAGENT API ERROR:", error);

    return res.status(500).json({
      reply: FALLBACK_REPLY,
    });
  }
}

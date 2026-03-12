// ─── REGION MAP ─────────────────────────────────────────────────────────────
const REGION_MAP = {
  // Single letters
  a:"A", b:"B", c:"C", d:"D", e:"E", f:"F", g:"G", h:"H", i:"I",
  j:"J", k:"K", l:"L", m:"M", n:"N", o:"O", p:"P", q:"Q", r:"R",
  s:"S", t:"T", u:"U", v:"V", w:"W", x:"X", y:"Y", z:"Z",
  // Words
  north:"N", south:"S", east:"E", west:"W",
  central:"C", northeast:"NE", northwest:"NW",
  southeast:"SE", southwest:"SW",
  // Indian regions
  mumbai:"MH", delhi:"DL", bangalore:"KA", chennai:"TN",
  hyderabad:"TS", kolkata:"WB", pune:"MH", ahmedabad:"GJ",
};

function resolveRegion(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return REGION_MAP[key] || raw.toUpperCase();
}

// ─── PARSER ─────────────────────────────────────────────────────────────────
export function parseCommand(input) {
  if (!input || typeof input !== "string") return { type: "UNKNOWN" };
  const raw = input.trim();
  const lower = raw.toLowerCase();

  // ── Greet
  if (/^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening))/.test(lower)) {
    return { type: "GREET" };
  }

  // ── Help
  if (/^(help|\?|commands|what can you do)/.test(lower)) {
    return { type: "HELP" };
  }

  // ── Logout
  if (/^(logout|log out|signout|sign out)/.test(lower)) {
    return { type: "LOGOUT" };
  }

  // ── Login
  // "login as admin password 1234"
  // "login admin 1234"
  // "login username=admin password=1234"
  const loginPatterns = [
    /login\s+(?:as\s+)?([^\s]+)\s+(?:password\s+|pass\s+|pwd\s+)?([^\s]+)/i,
    /login\s+username[=:\s]+([^\s]+)\s+password[=:\s]+([^\s]+)/i,
    /sign\s*in\s+(?:as\s+)?([^\s]+)\s+([^\s]+)/i,
  ];
  for (const pat of loginPatterns) {
    const m = raw.match(pat);
    if (m) return { type: "LOGIN", username: m[1], password: m[2] };
  }

  // ── Create CIF  (most flexible pattern)
  // Captures: optional count, optional type (PCIF/NPCIF), region, optional cust_type
  const cifPattern = /(?:create|make|generate|add|open)\s+(?:a\s+|an\s+)?(?:(\d+)\s+)?(?:(p?cif|npcif|np\s*cif|non[\s-]?personal\s+cif|personal\s+cif)\s+)?cif(?:s|account|accounts)?\s+(?:for\s+)?(?:(?:the\s+)?(\w+)\s+region|region\s+(\w+)|(\w+))/i;
  const cifMatch = raw.match(cifPattern);
  if (cifMatch) {
    const countRaw  = cifMatch[1];
    const typeRaw   = (cifMatch[2] || "pcif").toLowerCase();
    const regionRaw = cifMatch[3] || cifMatch[4] || cifMatch[5] || "";

    const no_cif  = Math.min(Math.max(parseInt(countRaw || "1"), 1), 10);
    const acc_type = /np|non/.test(typeRaw) ? "NPCIF" : "PCIF";
    const region  = resolveRegion(regionRaw);

    // Optional cust_type at end: "... individual|joint|corporate|trust"
    const custMatch = raw.match(/(individual|joint|corporate|trust)\s*$/i);
    const cust_type = custMatch ? custMatch[1].toLowerCase() : "individual";

    return { type: "CREATE_CIF", payload: { no_cif, acc_type, region, cust_type } };
  }

  // ── Simpler fallback: "cif k", "cif for k", "create k cif"
  const simpleCIF = raw.match(/(?:cif\s+(?:for\s+)?(\w+)|(\w+)\s+cif)/i);
  if (simpleCIF) {
    const regionRaw = simpleCIF[1] || simpleCIF[2];
    // Avoid matching words like "a", "an", "the", "1", "new"
    if (regionRaw && !/^(a|an|the|\d+|new|my)$/i.test(regionRaw)) {
      return {
        type: "CREATE_CIF",
        payload: { no_cif: 1, acc_type: "PCIF", region: resolveRegion(regionRaw), cust_type: "individual" },
      };
    }
  }

  // ── Create deposit account
  // "create deposit account", "open deposit account", "create deposit account for cif 12345"
  const depositPattern = /(?:create|open|add)\s+(?:a\s+)?(?:new\s+)?deposit\s+account(?:\s+for\s+cif\s+(\w+))?/i;
  const depositMatch = raw.match(depositPattern);
  if (depositMatch) {
    const cif_id = depositMatch[1] || null;
    return { type: "CREATE_DEPOSIT_ACCOUNT", payload: { cif_id } };
  }

  return { type: "UNKNOWN", raw };
}

// ─── HELP TEXT ───────────────────────────────────────────────────────────────
export const HELP_LINES = [
  { icon: "🔐", cmd: "login as <username> password <password>",  desc: "Authenticate with your credentials" },
  { icon: "🏦", cmd: "create a CIF for K region",               desc: "Create 1 Personal CIF in region K" },
  { icon: "🏦", cmd: "create 3 CIFs for M region",              desc: "Create 3 Personal CIFs in region M" },
  { icon: "🏦", cmd: "create NPCIF for B region",                desc: "Create a Non-Personal CIF in region B" },
  { icon: "🏦", cmd: "create a CIF for K region corporate",     desc: "Create CIF with customer type" },
  { icon: "💰", cmd: "create deposit account",                   desc: "Create a new deposit account" },
  { icon: "💰", cmd: "create deposit account for cif <id>",      desc: "Create deposit account for a CIF" },
  { icon: "🚪", cmd: "logout",                                   desc: "Clear session and logout" },
];

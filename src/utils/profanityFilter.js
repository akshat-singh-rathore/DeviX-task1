// Common abusive/profane words list for client-side filtering
const PROFANITY_WORDS = [
  "fuck",
  "fucking",
  "fucked",
  "fucker",
  "shit",
  "shitting",
  "bitch",
  "bitches",
  "asshole",
  "ass",
  "bastard",
  "dick",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "cock",
  "motherfucker",
  "bullshit",
  "crap",
  "piss",
  "prick",
  "twat",
  "wanker",
];

// Build regex matching whole profane words or common character variations
const buildProfanityRegex = () => {
  const pattern = PROFANITY_WORDS.map((word) => {
    // Escape regex special chars
    return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|");

  return new RegExp(`\\b(${pattern})\\b`, "gi");
};

const profanityRegex = buildProfanityRegex();

/**
 * Checks if a text contains any restricted profane words.
 * @param {string} text
 * @returns {boolean}
 */
export function hasProfanity(text) {
  if (!text) return false;
  return profanityRegex.test(text);
}

/**
 * Filters and masks profane words with asterisks (e.g. "f***").
 * @param {string} text
 * @returns {string}
 */
export function filterProfanity(text) {
  if (!text) return "";
  return text.replace(profanityRegex, (match) => {
    if (match.length <= 2) return "*".repeat(match.length);
    return match[0] + "*".repeat(match.length - 2) + match[match.length - 1];
  });
}

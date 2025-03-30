const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const axios = require("axios");

// Define secret (this must match what you set in Secret Manager)
const CLAUDE_API_KEY = defineSecret("CLAUDE_API_KEY");

// Claude API endpoint
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

// Claude prompt setup
function buildPrompt(title, author) {
  return `Please generate metadata for the book titled "${title}" by ${author}. 
Return JSON with the following keys:
- "summary": 1–3 paragraph original summary (not from web sources, max 8 sentences per paragraph),
- "pageCount": a numeric page count of the most referenced or most recent edition,
- "yearPublished": year of publication (can include BCE),
- "contentTags": array of 3–8 descriptive tags (simple nouns or phrases).

Use your best judgment and knowledge for pageCount and yearPublished.`;
}

// Claude API call
async function fetchClaudeMetadata(apiKey, title, author) {
  const body = {
    model: "claude-3-sonnet-20240229",
    messages: [{ role: "user", content: buildPrompt(title, author) }],
    max_tokens: 1024,
    temperature: 0.7,
  };

  const headers = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  const response = await axios.post(CLAUDE_API_URL, body, { headers });
  const text = response.data?.content?.[0]?.text;

  if (!text) {
    throw new Error("No content returned from Claude.");
  }

  const match = text.match(/```json([\s\S]*?)```/);
  const json = match ? match[1] : text;

  return JSON.parse(json.trim());
}

// Export the function
exports.generateMetadata = onRequest({ secrets: [CLAUDE_API_KEY] }, async (req, res) => {
  try {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author." });
    }

    const metadata = await fetchClaudeMetadata(CLAUDE_API_KEY.value(), title, author);
    return res.status(200).json({ metadata });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return res.status(500).json({ error: error.message || "Internal error" });
  }
});

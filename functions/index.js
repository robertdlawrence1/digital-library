const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

// Gen 2, region + secret declaration (using serviceAccountEmail explicitly)
exports.generateMetadataV2 = onRequest({
  region: "us-central1",
  secrets: ["CLAUDE_API_KEY"],
  serviceAccountEmail: "digital-library-4f53e@appspot.gserviceaccount.com",
}, (req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key, anthropic-version");
      res.set("Access-Control-Max-Age", "3600");
      return res.status(204).send("");
    }

    res.set("Access-Control-Allow-Origin", "*");

    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      console.error("Claude API key is missing.");
      return res.status(500).json({ error: "Claude API key not found" });
    }

    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author in request body" });
    }

    const prompt = `
You are a digital librarian. Given the following book title and author, generate the following:
- A short summary (1-3 paragraphs, max 8 sentences per paragraph)
- Estimated page count (as a digit)
- Estimated year published (use most referenced or most recent edition, digit only — BCE is allowed)
- A list of contentTags (3-8 keywords describing genre, themes, or topics; match existing Firestore tag list if possible)

Title: ${title}
Author: ${author}

Respond in JSON format with the keys: summary, pageCount, yearPublished, contentTags.
`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-2.1",
          max_tokens: 1024,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const result = await response.json();
      const content = result?.content?.[0]?.text;

      if (!content) {
        throw new Error("No content returned from Claude");
      }

      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error("Claude metadata generation failed:", err);
      return res.status(500).json({ error: "Failed to generate metadata" });
    }
  });
});

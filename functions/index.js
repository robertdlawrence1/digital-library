const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const axios = require("axios");

initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();

exports.generateMetadata = onRequest(
  { secrets: ["CLAUDE_API_KEY"] },
  async (req, res) => {
    try {
      const { title, author } = req.body;

      if (!title || !author) {
        return res.status(400).json({ error: "Missing title or author" });
      }

      // Step 1: Fetch live contentTags from Firestore
      const tagsSnapshot = await db.collection("contentTags").get();
      const availableTags = tagsSnapshot.docs.map(doc => doc.id);

      // Step 2: Construct Claude prompt
      const prompt = `
You are helping maintain a digital library. Based on the book title and author below, generate metadata for Firestore. Follow these exact rules:

Title: ${title}
Author: ${author}

Instructions:

1. Choose the most referenced edition of the book. If unclear, use the most recent edition.
2. Return the following fields in JSON format:
{
  "title": string (from most referenced edition),
  "author": string (same logic),
  "summary": string (1–3 paragraphs, max 8 sentences each, your own summary not sourced),
  "pageCount": number (digits only),
  "yearPublished": string (digits only; allow "BCE" or commas if needed),
  "contentTags": string[] (derived from your summary, must match this list exactly: [${availableTags.join(", ")}])
}
Important: The "contentTags" must only include items from the list provided above.
Do not include explanations. Only return valid JSON with exactly those fields.
`;

      // Step 3: Call Claude API
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-2.1",
          max_tokens: 1024,
          messages: [
            { role: "user", content: prompt }
          ]
        },
        {
          headers: {
            "x-api-key": process.env.CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          }
        }
      );

      const raw = response.data?.content?.[0]?.text;
      const metadata = JSON.parse(raw);

      res.status(200).json(metadata);
    } catch (error) {
      console.error("Claude metadata error:", error);
      res.status(500).json({ error: "Metadata generation failed" });
    }
  }
);


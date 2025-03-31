const functions = require("firebase-functions");
const axios = require("axios");

exports.generateMetadata = functions.https.onRequest(async (req, res) => {
  try {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author." });
    }

    const prompt = `
You are an expert book analyst. Given a book's title and author, provide the following metadata based on the most recent or most referenced edition:

1. A unique summary (1–3 paragraphs, max 8 sentences per paragraph) written in your own words.
2. Estimated page count (digits only).
3. Year published (digits only, commas or BCE allowed).
4. A list of relevant content tags derived from the summary.

Book:
Title: ${title}
Author: ${author}

Respond in this format:
{
  "title": "...",
  "author": "...",
  "summary": "...",
  "pageCount": "...",
  "yearPublished": "...",
  "contentTags": ["...", "...", "..."]
}
`;

    const apiKey = process.env.CLAUDE_API_KEY;
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        temperature: 0.5,
        system: "You are a metadata generator for a digital book library.",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const text = response.data?.content?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "Claude response was empty." });
    }

    const metadata = JSON.parse(text);
    return res.status(200).json(metadata);
  } catch (err) {
    console.error("Error generating metadata:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

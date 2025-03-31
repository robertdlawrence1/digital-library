const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const axios = require("axios");

// Define Claude API Key as a secret
const CLAUDE_API_KEY = defineSecret("CLAUDE_API_KEY");

exports.generateMetadata = onRequest({ 
  region: "us-central1", 
  secrets: [CLAUDE_API_KEY] 
}, async (req, res) => {
  try {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author." });
    }

    // Log what we're about to do
    console.log(`Generating metadata for: ${title} by ${author}`);

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

    console.log("Sending request to Claude API");
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
          "x-api-key": CLAUDE_API_KEY.value(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    console.log("Received response from Claude API");
    const text = response.data?.content?.[0]?.text;
    if (!text) {
      console.error("Empty response from Claude:", response.data);
      return res.status(500).json({ error: "Claude response was empty." });
    }

    try {
      const metadata = JSON.parse(text);
      return res.status(200).json(metadata);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.log("Raw text received:", text);
      return res.status(500).json({ 
        error: "Failed to parse Claude response into JSON", 
        rawResponse: text 
      });
    }
  } catch (err) {
    console.error("Error generating metadata:", err.message);
    if (err.response) {
      console.error("API response error data:", err.response.data);
    }
    return res.status(500).json({ error: "Internal server error.", details: err.message });
  }
});
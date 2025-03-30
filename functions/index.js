const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

const CLAUDE_API_KEY = defineSecret("CLAUDE_API_KEY");

exports.generateMetadata = functions
  .region("us-central1")
  .runWith({
    secrets: [CLAUDE_API_KEY],
    timeoutSeconds: 60,
    memory: "1GB",
  })
  .https.onRequest(async (req, res) => {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author" });
    }

    try {
      const metadata = await fetchClaudeMetadata(CLAUDE_API_KEY.value(), title, author);
      res.status(200).json(metadata);
    } catch (error) {
      console.error("Error generating metadata:", error);
      res.status(500).json({ error: "Failed to generate metadata" });
    }
  });

async function fetchClaudeMetadata(apiKey, title, author) {
  const prompt = `
You're an intelligent assistant helping a digital library app automatically create book metadata. Based only on the title and author provided, infer the following:

1. A unique summary (not sourced or copied from elsewhere) in 1–3 paragraphs (no more than 8 sentences per paragraph). Write as if for a curious reader.
2. A page count estimate for the most referenced or most recent edition.
3. The year published (as a number, allow BCE if applicable) for the same edition.
4. A list of 3–10 content tags inferred from the summary (e.g., “science fiction”, “climate change”, “capitalism”).

Only return valid JSON in the following format:

\`\`\`json
{
  "summary": "SUMMARY",
  "pageCount": 123,
  "yearPublished": 2010,
  "contentTags": ["tag1", "tag2", "tag3"]
}
\`\`\`

The book is titled "${title}" by ${author}.
`;

  const response = await fetch("https://api.anthropic.com/v1/complete", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-2.1",
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 1024,
      temperature: 0.7,
      stop_sequences: ["\n\nHuman:"],
    }),
  });

  const data = await response.json();
  const text = data.completion;

  // Extract JSON block and handle errors
  const match = text.match(/```json([\s\S]*?)```/);
  const json = match ? match[1] : text;

  try {
    return JSON.parse(json.trim());
  } catch (err) {
    throw new Error(`Error parsing JSON from Claude: ${err.message}\nRaw response: ${json}`);
  }
}

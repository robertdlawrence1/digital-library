const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Define Claude API Key as a secret
const CLAUDE_API_KEY = defineSecret("CLAUDE_API_KEY");

exports.generateMetadata = onRequest({ 
  region: "us-central1", 
  secrets: [CLAUDE_API_KEY] 
}, async (req, res) => {
  try {
    // Just return a simple response without any API calls
    return res.status(200).json({ 
      message: "Function deployed successfully",
      secretExists: CLAUDE_API_KEY.exists()
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

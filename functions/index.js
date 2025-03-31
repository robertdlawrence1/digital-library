const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Define Claude API Key as a secret
const CLAUDE_API_KEY = defineSecret("CLAUDE_API_KEY");

exports.generateMetadata = onRequest({ 
  region: "us-central1",
  serviceAccountEmail: "digital-library-4f53e@appspot.gserviceaccount.com", // use serviceAccountEmail
  secrets: [CLAUDE_API_KEY]
}, async (req, res) => {
  try {
    return res.status(200).json({ 
      message: "Function deployed successfully",
      secretExists: CLAUDE_API_KEY.exists()
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");

// Gen 2, region + secret declaration (using serviceAccountEmail explicitly)
exports.generateMetadataV2 = onRequest({
  region: "us-central1",
  secrets: ["CLAUDE_API_KEY"],
  serviceAccountEmail: "digital-library-4f53e@appspot.gserviceaccount.com",
}, async (req, res) => {
  try {
    return res.status(200).json({
      message: "Function deployed successfully",
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

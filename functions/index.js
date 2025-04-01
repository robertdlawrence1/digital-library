const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");

// Gen 2, region + secret declaration (omit serviceAccountEmail)
exports.generateMetadata = onRequest({
  region: "us-central1",
  secrets: ["CLAUDE_API_KEY"], // Claude secret already set in Firebase
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

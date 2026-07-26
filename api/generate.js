// This code runs on the SERVER (not in the user's browser).
// The API key stays hidden here — it is never sent to the visitor.

const FORMAT_INSTRUCTIONS = {
  essay:
    "Write a well-structured short essay (4-6 paragraphs) on the given topic. Clear thesis, logical flow, strong conclusion.",
  script:
    "Write a punchy short-form video script (60-90 seconds spoken) on the given topic: a hook in the first line, 3-4 body beats, and a closing line. Format as plain narration, no camera directions.",
  caption:
    "Write a scroll-stopping social media caption on the given topic: 2-3 short lines plus 5 relevant hashtags.",
  email:
    "Write a clear, professional short email on the given topic, with subject line, greeting, 2-3 sentence body, and sign-off.",
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, format } = req.body || {};

  if (!topic || !format || !FORMAT_INSTRUCTIONS[format]) {
    return res.status(400).json({ error: "Missing or invalid topic/format" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is not configured with an API key yet." });
  }

  try {
    const prompt = `${FORMAT_INSTRUCTIONS[format]}\n\nTopic: ${topic}`;

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await geminiRes.json();

    if (data.error) {
      return res.status(502).json({ error: data.error.message || "Generation failed" });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

    return res.status(200).json({ text: text.trim() || "(empty response, try again)" });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}

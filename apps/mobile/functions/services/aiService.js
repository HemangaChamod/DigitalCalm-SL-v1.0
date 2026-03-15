const axios = require("axios");

async function generateNudge(pattern, context) {
  try {

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a compassionate digital wellbeing coach."
          },
          {
            role: "user",
            content: `
            User behaviour pattern:
            ${pattern}

            User context:
            ${context}

            Write a short mindfulness nudge encouraging the user to take a break.

            Rules:
            - Friendly tone
            - Maximum 30 words
            `
          }
        ],
        max_tokens: 80,
        temperature: 0.8
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {

    console.error(
      "AI generation error:",
      error.response?.data || error.message
    );

    return "Take a short mindful break and reconnect with the present moment.";
  }
}

module.exports = { generateNudge };
/**
 * Ollama LLM Service
 * Handles communication with the locally-running Llama 3 model via Ngrok tunnel.
 */

const SYSTEM_PROMPT = `You are Sprout, a highly empathetic and motivating habit-tracking mascot. The user will tell you about the habit they just completed. 
Your tasks:
1. Reply to the user in a friendly, encouraging, and conversational tone (maximum 2 sentences).
2. Analyze the user's text to determine how difficult the task was for them on a scale of 1 to 5 (1 = very easy, 5 = extremely hard/struggled). If not mentioned, default to 3.
You MUST return ONLY a valid JSON object in the exact following format, without any markdown formatting or extra text:
{ "reply": "string", "difficulty_score": number }`;

/**
 * Sends a user message to the Ollama LLM and returns the parsed response.
 * @param {string} userMessage - The message from the user.
 * @returns {Promise<{reply: string, difficulty_score: number}>}
 */
async function chatWithSprout(userMessage) {
  const ollamaUrl = process.env.OLLAMA_API_URL;

  if (!ollamaUrl) {
    throw new Error('OLLAMA_API_URL is not configured in environment variables.');
  }

  const endpoint = `${ollamaUrl}/api/generate`;

  const payload = {
    model: 'llama3',
    prompt: userMessage,
    system: SYSTEM_PROMPT,
    stream: false,
    // Keep responses focused and deterministic
    options: {
      temperature: 0.7,
      num_predict: 256,
    },
  };

  console.log(`[OllamaService] Sending request to ${endpoint}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OllamaService] Ollama API error (${response.status}):`, errorText);
    throw new Error(`Ollama API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.response;

  console.log('[OllamaService] Raw LLM response:', rawText);

  // Parse the JSON from the LLM's response
  const parsed = parseLLMResponse(rawText);
  return parsed;
}

/**
 * Parses the LLM response text into the expected JSON format.
 * Handles edge cases like markdown code fences or extra whitespace.
 * @param {string} rawText - The raw text response from the LLM.
 * @returns {{reply: string, difficulty_score: number}}
 */
function parseLLMResponse(rawText) {
  let cleanedText = rawText.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  cleanedText = cleanedText.trim();

  try {
    const parsed = JSON.parse(cleanedText);

    // Validate the expected shape
    if (typeof parsed.reply !== 'string' || typeof parsed.difficulty_score !== 'number') {
      throw new Error('Response JSON missing required fields (reply, difficulty_score).');
    }

    // Clamp difficulty_score to 1–5 range
    parsed.difficulty_score = Math.max(1, Math.min(5, Math.round(parsed.difficulty_score)));

    return {
      reply: parsed.reply,
      difficulty_score: parsed.difficulty_score,
    };
  } catch (parseError) {
    console.error('[OllamaService] Failed to parse LLM JSON:', parseError.message);
    console.error('[OllamaService] Cleaned text was:', cleanedText);

    // Fallback: return a safe default so the user still gets a response
    return {
      reply: "Great job working on your habits today! Keep it up! 🌱",
      difficulty_score: 3,
    };
  }
}

module.exports = { chatWithSprout };

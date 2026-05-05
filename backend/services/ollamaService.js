/**
 * Ollama LLM Service
 * Handles communication with the locally-running Llama 3 model via Ngrok tunnel.
 * Dynamically injects the user's active habits so the LLM can detect completions.
 */

/**
 * Builds the system prompt dynamically, injecting the user's active habits.
 *
 * @param {Array<{id: string, name: string, category: string}>} activeHabits
 * @returns {string}
 */
function buildSystemPrompt(activeHabits) {
  // Format the habit list for the LLM
  let habitListBlock = 'The user has no active habits for today.';
  if (activeHabits && activeHabits.length > 0) {
    const habitLines = activeHabits.map(h => `  - ID: "${h.id}" | Name: "${h.name}" | Category: "${h.category}"`);
    habitListBlock = `The user's active habits for today are:\n${habitLines.join('\n')}`;
  }

  return `You are Sprout, a highly empathetic and motivating habit-tracking mascot.
${habitListBlock}

Your tasks when the user sends a message:
1. Reply to the user in a friendly, encouraging, and conversational tone (maximum 2 sentences).
2. Analyze the user's text to determine how difficult the task was for them on a scale of 1 to 5 (1 = very easy, 5 = extremely hard/struggled). If not mentioned, default to 3.
3. Determine if the user's message implies they completed one of their active habits listed above. If yes, return that habit's exact ID. If no match or unsure, return null.

You MUST return ONLY a valid JSON object in the exact following format, without any markdown formatting or extra text:
{ "reply": "string", "difficulty_score": number, "completed_habit_id": "string or null" }`;
}

/**
 * Sends a user message to the Ollama LLM and returns the parsed response.
 * @param {string} userMessage - The message from the user.
 * @param {Array<{id: string, name: string, category: string}>} [activeHabits] - The user's habits for today.
 * @returns {Promise<{reply: string, difficulty_score: number, completed_habit_id: string|null}>}
 */
async function chatWithSprout(userMessage, activeHabits = []) {
  const ollamaUrl = process.env.OLLAMA_API_URL;

  if (!ollamaUrl) {
    throw new Error('OLLAMA_API_URL is not configured in environment variables.');
  }

  const endpoint = `${ollamaUrl}/api/generate`;

  // Build dynamic system prompt with the user's habit context
  const systemPrompt = buildSystemPrompt(activeHabits);

  // Combine system prompt and user message into a single prompt string
  const fullPrompt = `${systemPrompt}\n User Message: ${userMessage}`;

  const payload = {
    model: 'llama3',
    prompt: fullPrompt,
    stream: false,
    format: 'json',
  };

  console.log(`[OllamaService] Sending request to ${endpoint}`);
  console.log(`[OllamaService] Active habits injected: ${activeHabits.length}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OllamaService] Ollama API HTTP error (${response.status}):`, errorText);
      throw new Error(`Ollama API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.response;

    console.log('[OllamaService] Raw LLM response:', rawText);

    // Parse the JSON from the LLM's response
    const parsed = parseLLMResponse(rawText, activeHabits);
    return parsed;
  } catch (error) {
    console.error(`[OllamaService] Failed to communicate with Ollama:`);
    console.error(`[OllamaService]   Error name: ${error.name}`);
    console.error(`[OllamaService]   Error message: ${error.message}`);
    console.error(`[OllamaService]   Endpoint: ${endpoint}`);
    if (error.cause) {
      console.error(`[OllamaService]   Cause: ${error.cause}`);
    }
    throw error;
  }
}

/**
 * Parses the LLM response text into the expected JSON format.
 * Handles edge cases like markdown code fences or extra whitespace.
 * Validates completed_habit_id against the actual active habits list.
 *
 * @param {string} rawText - The raw text response from the LLM.
 * @param {Array<{id: string}>} activeHabits - To validate the returned habit ID.
 * @returns {{reply: string, difficulty_score: number, completed_habit_id: string|null}}
 */
function parseLLMResponse(rawText, activeHabits = []) {
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

    // Validate completed_habit_id against the actual habit list
    let completedHabitId = parsed.completed_habit_id || null;
    if (completedHabitId) {
      const validIds = activeHabits.map(h => h.id);
      if (!validIds.includes(completedHabitId)) {
        console.warn(`[OllamaService] LLM returned invalid habit ID "${completedHabitId}" — not in active habits. Setting to null.`);
        completedHabitId = null;
      } else {
        console.log(`[OllamaService] LLM detected habit completion: ${completedHabitId}`);
      }
    }

    return {
      reply: parsed.reply,
      difficulty_score: parsed.difficulty_score,
      completed_habit_id: completedHabitId,
    };
  } catch (parseError) {
    console.error('[OllamaService] Failed to parse LLM JSON:', parseError.message);
    console.error('[OllamaService] Cleaned text was:', cleanedText);

    // Fallback: return a safe default so the user still gets a response
    return {
      reply: "Great job working on your habits today! Keep it up! 🌱",
      difficulty_score: 3,
      completed_habit_id: null,
    };
  }
}

module.exports = { chatWithSprout };

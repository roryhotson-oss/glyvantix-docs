type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(
  /\/$/,
  ""
);

export async function createDocumentCompletion(messages: ChatMessage[]) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI generation is not configured. Set AI_API_KEY on the server.");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const result = (await response.json()) as ChatCompletionResponse;
  const content = result.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }

  return content;
}
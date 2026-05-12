import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { name, title, business, category } = await req.json();

  // Validate required fields
  if (!name || !title || !business) {
    return new Response(
      JSON.stringify({ error: "name, title, and business are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "DEEPSEEK_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const categoryClause = category ? ` in the ${category} industry` : "";
  const prompt = `Write a 2–3 sentence professional bio in third person for ${name}, who works as a ${title} at ${business}${categoryClause}. The bio should be polished, concise, and suitable for a business directory. Do not include any preamble, explanation, or formatting — output only the bio text itself.`;

  // Call DeepSeek with streaming enabled
  const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!deepseekRes.ok) {
    const errText = await deepseekRes.text();
    return new Response(
      JSON.stringify({ error: `DeepSeek error: ${errText}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Transform the SSE stream from DeepSeek into a plain-text stream
  // with a typewriter effect: each character is sent with a 30 ms delay.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = deepseekRes.body!.getReader();
      let buffer = "";

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // DeepSeek sends newline-delimited SSE chunks
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (!delta) continue;

              // Typewriter: emit one character at a time with a 30 ms gap
              for (const char of delta) {
                controller.enqueue(encoder.encode(char));
                await delay(30);
              }
            } catch {
              // Malformed JSON chunk — skip silently
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

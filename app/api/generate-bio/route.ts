// app/api/generate/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 150,
      temperature: 0.7,
    }),
  });
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

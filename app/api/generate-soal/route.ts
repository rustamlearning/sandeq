import { NextRequest, NextResponse } from "next/server";
import { rateLimitApiUser, requireApiUser } from '@/lib/api-auth';

const MAX_PROMPT_LENGTH = 4000;
const AI_RATE_LIMIT = 10;
const AI_RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req, ['guru', 'admin']);
    if ('response' in auth) return auth.response;
    const limited = rateLimitApiUser(auth.user.id, 'generate-soal', AI_RATE_LIMIT, AI_RATE_WINDOW_MS);
    if (limited) return limited;

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt wajib diisi' }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: 'Prompt terlalu panjang' }, { status: 413 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'AI request gagal' }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "[]";
    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

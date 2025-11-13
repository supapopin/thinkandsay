// /app/api/ai/topic/route.js
import { genHintKeywords } from "@/lib/ai";
export async function POST(req) {
  const { koreanCue } = await req.json();
  const out = await genHintKeywords({ koreanCue });
  return Response.json(out);
}

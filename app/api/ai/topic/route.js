// /app/api/ai/topic/route.js
import { genTopicAndTargets } from "@/lib/ai";
export async function POST(req) {
  const { difficulty } = await req.json();
  const out = await genTopicAndTargets({ difficulty });
  return Response.json(out);
}

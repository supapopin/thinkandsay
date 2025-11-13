// /app/api/ai/topic/route.js
import { getFeedback } from "@/lib/ai";
export async function POST(req) {
  const { essay, topic, targets } = await req.json();
  const out = await genTopicAndTargets({ essay, topic, targets });
  return Response.json(out);
}

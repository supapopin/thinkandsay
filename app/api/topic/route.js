import { generateTopic } from "@/lib/ai";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { difficulty } = body;

    const topic = await generateTopic({ difficulty: difficulty || "B1" });

    return new Response(
      JSON.stringify({ topic }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("POST /api/topic error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

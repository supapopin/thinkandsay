import { generateHintKeywords } from "@/lib/ai";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { description, difficulty } = body;

    if (!description) {
      return new Response(
        JSON.stringify({ error: "description(한글 설명)이 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const keywords = await generateHintKeywords({
      description,
      difficulty: difficulty || "B1",
    });

    return new Response(
      JSON.stringify({ keywords }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("POST /api/hints error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

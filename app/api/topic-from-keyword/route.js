import { generateTopicFromKeyword } from "@/lib/ai";

export async function POST(req) {
  try {
    const body = await req.json();
    const { keyword, difficulty } = body || {};

    if (!keyword || !keyword.trim()) {
      return new Response(
        JSON.stringify({ error: "keyword는 필수입니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topic = await generateTopicFromKeyword({
      keyword: keyword.trim(),
      difficulty: difficulty || "B1",
    });

    return new Response(JSON.stringify({ topic }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/topic-from-keyword error:", e);

    return new Response(
      JSON.stringify({
        error: e.message || "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

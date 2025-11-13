import { listEssays, saveEssay } from "@/lib/db/supabase";

export async function GET() {
  try {
    const essays = await listEssays(); // userId 필터 없음 (MVP)

    return new Response(JSON.stringify(essays ?? []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/essays error:", e);

    return new Response(
      JSON.stringify({
        error: e.message || "Internal Server Error",
        code: e.code,
        details: e.details,
        hint: e.hint,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { topic, difficulty, content, targets } = body;

    // 최소 검증: topic, content는 있어야 함
    if (!topic || !content) {
      return new Response(
        JSON.stringify({ error: "topic과 content는 필수입니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 지금은 userId 없이 null로 넣기 (나중에 Auth 붙이면 바꿀 예정)
    const saved = await saveEssay({
      userId: null,
      topic,
      difficulty: difficulty || null,
      content,
      targets: targets || [],
    });

    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/essays error:", e);

    return new Response(
      JSON.stringify({
        error: e.message || "Internal Server Error",
        code: e.code,
        details: e.details,
        hint: e.hint,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
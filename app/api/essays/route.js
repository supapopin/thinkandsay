import { listEssays, saveEssay } from "@/lib/db/supabase";
import { generateFeedback } from "@/lib/ai";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId 쿼리 파라미터가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const essays = await listEssays({ userId });

    return new Response(JSON.stringify(essays), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/essays error:", e);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const body = await req.json();
    const { userId, topic, difficulty, content, targets } = body;
    
    // 최소 검증: topic, content는 있어야 함
    if (!topic || !content) {
      return new Response(
        JSON.stringify({ error: "topic과 content는 필수입니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "로그인이 필요합니다.(userId 없음)" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const saved = await saveEssay({
      userId,
      topic,
      difficulty: difficulty || null,
      content,
      targets: targets || [],
    });

    return new Response(JSON.stringify(saved), {
      status: 201, // 생성이니까 201도 괜찮음 (200이어도 동작에는 문제 없음)
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
import { getUserFromRequest } from "@/lib/auth";
import { listEssays, saveEssay } from "@/lib/db/supabase";

export async function GET(req) {
  try {
    const { user, error } = await getUserFromRequest(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: error || "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const essays = await listEssays({ userId: user.id });

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
    const { user, error } = await getUserFromRequest(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: error || "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { topic, difficulty, content, targets } = body;

    // 최소 검증: topic, content는 있어야 함
    if (!topic || !content) {
      return new Response(
        JSON.stringify({ error: "topic과 content는 필수입니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const saved = await saveEssay({
      userId: user.id,
      topic,
      difficulty: difficulty || null,
      content,
      targets: targets || [],
    });

    // 🔥 여기서 saved 안에 id, topic, difficulty, content 등이 포함돼 있어야 함
    // 예: { id, topic, difficulty, content, created_at, ... }

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
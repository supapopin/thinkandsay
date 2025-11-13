import { listEssayVersions } from "@/lib/db/supabase";

export async function GET(_req, context) {
  try {
    const params = await context.params;      // ✅ 여기!
    const essayId = params?.id;              // 이제 Promise 아님

    if (!essayId) {
      return new Response(
        JSON.stringify({ error: "Missing essay id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const versions = await listEssayVersions({ essayId, limit: 5 });

    return new Response(JSON.stringify(versions ?? []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/essays/[id]/versions error:", e);

    return new Response(
      JSON.stringify({
        error: e.message || "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

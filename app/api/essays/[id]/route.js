import { listEssayVersions } from "@/lib/db/supabase";

export async function GET(_req, context) {
  try {
    // ✅ 여기서 params를 await
    const params = await context.params;
    const essayId = params?.id;

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

import { getUserFromRequest } from "@/lib/auth";
import { listEssayVersions } from "@/lib/db/supabase";

export async function GET(req, context) {
  try {
    const { user, error } = await getUserFromRequest(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: error || "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const params = await context.params;      // ✅ 여기!
    const essayId = params?.id;              // 이제 Promise 아님

    if (!essayId) {
      return new Response(
        JSON.stringify({ error: "Missing essay id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const versions = await listEssayVersions({ essayId, userId: user.id, limit: 5 });

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

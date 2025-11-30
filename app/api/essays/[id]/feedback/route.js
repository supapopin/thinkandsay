import { getUserFromRequest } from "@/lib/auth";
import { getEssayById, saveEssayVersion } from "@/lib/db/supabase";
import { getFeedback } from "@/lib/ai";

export async function POST(req, context) {
  try {
    const { user, error } = await getUserFromRequest(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: error || "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const params = await context.params;     // ✅ 여기!
    const essayId = params?.id;

    if (!essayId) {
      return new Response(
        JSON.stringify({ error: "Missing essay id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const essay = await getEssayById(essayId, user.id);

    if (!essay) {
      return new Response(
        JSON.stringify({ error: "Essay not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const feedback = await getFeedback({
      essay: essay.content || "",
      topic: essay.topic,
      targets: essay.targets || [],
    });

    const savedVersion = await saveEssayVersion({
      essayId,
      userId: user.id,
      aiFeedback: feedback,
    });

    return new Response(
      JSON.stringify({
        version: savedVersion,
        feedback,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("POST /api/essays/[id]/feedback error:", e);

    return new Response(
      JSON.stringify({
        error: e.message || "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

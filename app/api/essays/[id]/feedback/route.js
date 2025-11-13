import { getEssayById, saveEssayVersion } from "@/lib/db/supabase";
import { getFeedback } from "@/lib/ai";

export async function POST(_req, context) {
  try {
    const params = await context.params;     // ✅ 여기!
    const essayId = params?.id;

    if (!essayId) {
      return new Response(
        JSON.stringify({ error: "Missing essay id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const essay = await getEssayById(essayId);

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

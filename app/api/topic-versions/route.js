import { listVersionsByTopic } from "@/lib/db/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Missing topic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const versions = await listVersionsByTopic({ topic });

    return new Response(JSON.stringify(versions ?? []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/topic-versions error:", e);

    return new Response(
      JSON.stringify({
        error: e.message || "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

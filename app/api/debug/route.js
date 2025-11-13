export function GET() {
  return Response.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    roleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "undefined",
    openai: process.env.OPENAI_API_KEY ? "OK" : "undefined"
  });
}

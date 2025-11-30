import { supabaseAdmin } from "./db/supabase";

export async function getUserFromRequest(req) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return { user: null, error: "인증 토큰이 필요합니다." };
  }

  const token = header.slice(7).trim();
  if (!token) {
    return { user: null, error: "인증 토큰이 필요합니다." };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: "유효하지 않은 토큰입니다." };
  }

  return { user: data.user, token };
}

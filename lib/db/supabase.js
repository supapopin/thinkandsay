import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

// 에세이 한 개 가져오기
export async function getEssayById(essayId, userId) {
  if (!userId) throw new Error("userId is required");

  let query = supabaseAdmin
    .from("essays")
    .select("*")
    .eq("id", essayId)
    .limit(1);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return data;
}

// 다음 버전 번호 계산 (1,2,3,...)
export async function getNextVersionNumber(essayId, userId) {
  if (!userId) throw new Error("userId is required");

  let query = supabaseAdmin
    .from("essay_versions")
    .select("version_number")
    .eq("essay_id", essayId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  if (!data || data.length === 0) return 1;
  return (data[0].version_number || 0) + 1;
}

// 첨삭 버전 저장
export async function saveEssayVersion({ essayId, userId, aiFeedback }) {
  if (!userId) throw new Error("userId is required");

  const version_number = await getNextVersionNumber(essayId, userId);

  const { data, error } = await supabaseAdmin
    .from("essay_versions")
    .insert({
      essay_id: essayId,
      user_id: userId,
      ai_feedback: aiFeedback,
      version_number
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 특정 에세이의 최근 버전들 조회
export async function listEssayVersions({ essayId, userId, limit = 5 }) {
  if (!userId) throw new Error("userId is required");

  let query = supabaseAdmin
    .from("essay_versions")
    .select("id, version_number, ai_feedback, created_at")
    .eq("essay_id", essayId)
    .order("version_number", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// 에세이 저장
export async function saveEssay({ userId, topic, difficulty, content, targets }) {
  if (!userId) throw new Error("userId is required");

  const { data, error } = await supabaseAdmin
    .from("essays")
    .insert({
      user_id: userId,
      topic,
      difficulty,
      content,
      targets,
    })
    .select()
    .single(); // ✅ 삽입된 row 한 개를 data로 받기

  if (error) throw error;
  return data; // { id, topic, difficulty, content, ... }
}

export async function listEssays({ userId }) {
  if (!userId) throw new Error("userId is required");

  const { data, error } = await supabaseAdmin
    .from("essays")
    .select("id, topic, difficulty, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}


// 같은 topic으로 작성된 에세이들의 모든 첨삭 버전 조회
export async function listVersionsByTopic({ topic, userId, limit = 50 }) {
  if (!userId) throw new Error("userId is required");

  // 1) topic에 해당하는 에세이들 가져오기
  const { data: essays, error } = await supabaseAdmin
    .from("essays")
    .select("id, topic, difficulty, content, created_at") // ✅ content 추가
    .eq("topic", topic)
    .eq("user_id", userId);

  if (error) throw error;
  if (!essays || essays.length === 0) return [];

  const essayIds = essays.map((e) => e.id);

  // 2) 그 에세이들에 대한 첨삭 버전들 전부 가져오기
  const { data: versions, error: vError } = await supabaseAdmin
    .from("essay_versions")
    .select("id, essay_id, version_number, ai_feedback, created_at")
    .in("essay_id", essayIds)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (vError) throw vError;

  const essayById = Object.fromEntries(essays.map((e) => [e.id, e]));

  // 3) 각 버전에 관련 에세이 정보 붙여서 반환
  return (versions || []).map((v) => ({
    ...v,
    essay: essayById[v.essay_id] || null,
  }));
}

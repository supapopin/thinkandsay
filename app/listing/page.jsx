"use client";

import { useEffect, useState } from "react";
import EssayCard from "@/components/EssayCard";
import { supabase } from "@/lib/supabaseClient";

export default function ListingPage() {
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        // 1) 로그인 유저 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setEssays([]);
          setError("로그인이 필요합니다.");
          return;
        }

        // 2) userId 기준으로 에세이 가져오기
        const res = await fetch(`/api/essays?userId=${user.id}`);
        const data = await res.json();

        if (!res.ok) {
          console.error("list error:", data);
          setError(data.error || "에세이를 불러오는 중 오류가 발생했습니다.");
          setEssays([]);
          return;
        }

        if (!Array.isArray(data)) {
          setError("응답 형식이 올바르지 않습니다.");
          setEssays([]);
          return;
        }

        setEssays(data);
      } catch (e) {
        console.error(e);
        setError("네트워크 오류가 발생했습니다.");
        setEssays([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);


  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Essays</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-sm">에세이 목록을 불러오는 중...</p>
      ) : essays.length === 0 ? (
        <p className="text-gray-500">아직 저장된 에세이가 없습니다.</p>
      ) : (
        <div className="grid gap-4">
          {essays.map((e) => (
            <EssayCard key={e.id} essay={e} />
          ))}
        </div>
      )}
    </main>
  );
}

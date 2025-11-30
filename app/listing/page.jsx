"use client";

import { useEffect, useMemo, useState } from "react";
import EssayCard from "@/components/EssayCard";
import { useAuth } from "@/lib/auth-context";

export default function ListingPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/essays", { headers: authHeaders });
        const data = await res.json();

        if (!res.ok) {
          console.error("list error:", data);
          setError(data.error || "에세이 목록을 불러오는 중 오류가 발생했습니다.");
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
    if (user) {
      load();
    }
  }, [user, authHeaders]);

  if (authLoading) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <p className="text-gray-600 text-sm">로그인 상태를 확인하는 중입니다...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">My Essays</h1>
        <p className="text-gray-700 text-sm">
          내 계정의 에세이를 보려면 먼저 상단에서 로그인해 주세요.
        </p>
      </main>
    );
  }

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

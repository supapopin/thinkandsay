// app/auth/page.jsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 현재 로그인 상태 가져오기
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLoginWithGoogle() {
    setLoading(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Supabase의 Redirect URL 설정과 맞춰줄 것
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth`
              : undefined,
        },
      });

      if (error) {
        console.error(error);
        setMsg(error.message || "Google 로그인 중 오류가 발생했습니다.");
      }
      // 실제 리다이렉트는 Supabase가 처리함
    } catch (e) {
      console.error(e);
      setMsg("Google 로그인 중 예기치 못한 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setMsg("로그아웃되었습니다.");
  }

  function goToMain() {
    router.push("/writing");
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">로그인</h1>

      {user ? (
        <div className="p-3 border rounded text-sm bg-gray-50 space-y-2">
          <div>
            <b>현재 로그인:</b>{" "}
            <span className="text-gray-700">{user.email}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToMain}
              className="px-3 py-1.5 rounded text-xs bg-black text-white"
            >
              Writing으로 가기
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded text-xs border text-gray-700 hover:bg-gray-100"
            >
              로그아웃
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            이 앱은 Google 계정으로만 로그인할 수 있어요.
          </p>
          <button
            type="button"
            onClick={handleLoginWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border rounded py-2 text-sm hover:bg-gray-50 disabled:bg-gray-200"
          >
            {loading ? "Google로 이동 중..." : "Google 계정으로 로그인"}
          </button>
        </div>
      )}

      {msg && <p className="text-xs text-gray-700">{msg}</p>}
    </main>
  );
}

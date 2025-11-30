"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthStatus() {
  const { user, supabase, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("로그인 링크를 이메일로 보냈습니다.");
    }
    setSending(false);
  }

  async function handleGoogleLogin() {
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setMessage(error.message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <span className="text-xs text-gray-500">계정 확인 중...</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-gray-700 truncate max-w-[140px] sm:max-w-none">
          {user.email || user.id}
        </span>
        <button
          type="button"
          className="px-2 py-1 border rounded hover:bg-gray-100"
          onClick={handleSignOut}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <form className="flex items-center gap-2" onSubmit={handleEmailLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        className="w-32 sm:w-44 px-2 py-1 text-xs sm:text-sm border rounded"
      />
      <button
        type="submit"
        disabled={sending}
        className="px-2 py-1 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-60"
      >
        {sending ? "전송 중" : "로그인 링크"}
      </button>
      <button
        type="button"
        className="px-2 py-1 text-xs sm:text-sm border rounded hover:bg-gray-100"
        onClick={handleGoogleLogin}
      >
        Google
      </button>
      {message && <span className="text-[11px] text-gray-600">{message}</span>}
    </form>
  );
}

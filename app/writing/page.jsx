"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DifficultySelect from "@/components/DifficultySelect";
import Editor from "@/components/Editor";
import HintBox from "@/components/HintBox";

const REFRESH_KEY = "topicRefreshState";
const MAX_REFRESH = 3;
const WINDOW_MINUTES = 5;

export default function WritingPage() {
  const [difficulty, setDifficulty] = useState("B1");
  const [topic, setTopic] = useState("");
  const [essay, setEssay] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshInfo, setRefreshInfo] = useState({
    remaining: MAX_REFRESH,
    resetAt: null,
  });
  const [generatingTopic, setGeneratingTopic] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 topic, difficulty 받아오기
  const presetTopic = searchParams.get("topic");
  const presetDifficulty = searchParams.get("difficulty");

  useEffect(() => {
    if (presetTopic) {
      setTopic(presetTopic);
    }
    if (presetDifficulty) {
      setDifficulty(presetDifficulty);
    }
  }, [presetTopic, presetDifficulty]);

  useEffect(() => {
  if (typeof window === "undefined") return;
    const info = getRefreshStateInfo();
    setRefreshInfo({
      remaining: info.remaining,
      resetAt: info.resetAt,
    });
  }, []);

  // 🔸 localStorage에서 상태 읽기
function readRefreshStateRaw() {
  if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(REFRESH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        used: typeof parsed.used === "number" ? parsed.used : 0,
        resetAt: typeof parsed.resetAt === "number" ? parsed.resetAt : 0,
      };
    } catch {
      return null;
    }
  }

  // 🔸 localStorage에 저장
  function writeRefreshStateRaw(state) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(REFRESH_KEY, JSON.stringify(state));
  }

  // 🔸 현재 시점 기준으로 "사용 횟수 / 남은 횟수" 계산
  function getRefreshStateInfo() {
    const now = Date.now();
    const raw = readRefreshStateRaw();

    if (!raw || !raw.resetAt || now >= raw.resetAt) {
      // 창이 없거나 만료됨 → 새 창 시작 가능
      return {
        used: 0,
        remaining: MAX_REFRESH,
        resetAt: null,
      };
    }

    const used = Math.min(Math.max(raw.used, 0), MAX_REFRESH); // 0~MAX 클램핑
    const remaining = Math.max(0, MAX_REFRESH - used);

    return {
      used,
      remaining,
      resetAt: raw.resetAt,
    };
  }

  // 🔸 새로고침 1회 소비 (성공적으로 토픽을 새로 받았을 때만 호출)
  function consumeRefreshChance() {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const info = getRefreshStateInfo();
    let used = info.used;
    let resetAt = info.resetAt;

    if (!resetAt) {
      // 새 30분 창 시작
      used = 1;
      resetAt = now + WINDOW_MINUTES * 60 * 1000;
    } else if (info.remaining <= 0) {
      used = MAX_REFRESH;
    } else {
      used = Math.min(MAX_REFRESH, used + 1);
    }

    writeRefreshStateRaw({ used, resetAt });
    const updated = getRefreshStateInfo();
    setRefreshInfo({
      remaining: updated.remaining,
      resetAt: updated.resetAt,
    });
  }

  // 🔸 새 토픽 생성 요청 (AI + 제한 체크)
    async function handleGenerateTopic() {
      if (generatingTopic) return;
      if (typeof window === "undefined") return;

      const isFirstGeneration = !topic || !topic.trim(); // ✅ topic이 비어있으면 "첫 생성"

      // 🔹 첫 생성이 아니라면 → 새로고침 기회 체크
      if (!isFirstGeneration) {
        const info = getRefreshStateInfo();

        if (info.remaining <= 0) {
          let msg =
            "토픽 새로고침 가능 횟수를 모두 사용했어요. 30분 후에 다시 시도해 주세요.";
          if (info.resetAt) {
            const date = new Date(info.resetAt);
            msg += `\n(리셋 예정 시각: ${date.toLocaleTimeString()})`;
          }
          alert(msg);
          return;
        }
      }

      setGeneratingTopic(true);
      try {
        const res = await fetch("/api/topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty }),
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("topic error:", data);
          alert(data.error || "토픽 생성 중 오류가 발생했습니다.");
          return;
        }

        setTopic(data.topic);

        // 🔹 첫 생성이 아니라면 → 이때 새로고침 1회 소비
        if (!isFirstGeneration) {
          consumeRefreshChance();
        }
      } catch (e) {
        console.error(e);
        alert("네트워크 오류로 토픽을 불러오지 못했습니다.");
      } finally {
        setGeneratingTopic(false);
      }
    }


  async function handleSaveEssay() {
    if (!topic) {
      alert("먼저 주제를 생성하거나 직접 적어주세요.");
      return;
    }
    if (!essay.trim()) {
      alert("에세이 내용을 작성해 주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty,
          content: essay,
          targets: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("save error:", data);
        alert(data.error || "저장 중 오류가 발생했습니다.");
        setSaving(false);
        return;
      }

      router.push("/listing");
    } catch (e) {
      console.error(e);
      alert("네트워크 오류가 발생했습니다.");
      setSaving(false);
    }
  }

  const resetInfoText =
    refreshInfo.resetAt && refreshInfo.remaining < MAX_REFRESH
      ? ` (리셋: ${new Date(refreshInfo.resetAt).toLocaleTimeString()})`
      : "";

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600 }}>Writing</h1>

      <section style={{ marginTop: "1.5rem" }}>
        <DifficultySelect value={difficulty} onChange={setDifficulty} />
        <button
          onClick={handleGenerateTopic}
          disabled={generatingTopic}
          style={{
            marginLeft: "0.5rem",
            padding: "0.3rem 0.7rem",
            cursor: generatingTopic ? "default" : "pointer",
          }}
        >
          {generatingTopic ? "토픽 생성 중..." : "AI로 주제 생성"}
        </button>
        <span style={{ marginLeft: "0.75rem", fontSize: "0.85rem", color: "#666" }}>
          남은 새로고침: {refreshInfo.remaining} / {MAX_REFRESH}
          {resetInfoText}
        </span>
      </section>

      {topic && (
        <section
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <strong>Topic</strong>
          <p style={{ marginTop: "0.5rem" }}>{topic}</p>
        </section>
      )}

      <Editor value={essay} onChange={setEssay} />

      <HintBox difficulty={difficulty} />

      <button
        onClick={handleSaveEssay}
        disabled={saving}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: saving ? "#555" : "black",
          color: "white",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {saving ? "저장 중..." : "에세이 저장"}
      </button>
    </main>
  );
}
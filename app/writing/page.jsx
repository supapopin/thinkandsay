"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DifficultySelect from "@/components/DifficultySelect";
import Editor from "@/components/Editor";
import HintBox from "@/components/HintBox";

const REFRESH_KEY = "topicRefreshState";
const MAX_REFRESH = 3;
const WINDOW_MINUTES = 5;

export default function WritingPage() {
  const router = useRouter();

  const [difficulty, setDifficulty] = useState("B1");
  const [topic, setTopic] = useState("");
  const [essay, setEssay] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInfo, setRefreshInfo] = useState({
    remaining: MAX_REFRESH,
    resetAt: null,
  });
  const [generatingTopic, setGeneratingTopic] = useState(false);

  const searchParams = useSearchParams();

  // URL에서 topic, difficulty 받아오기
  const presetTopic = searchParams.get("topic");
  const presetDifficulty = searchParams.get("difficulty");
  // 질문 설정 방식: ai | manual-keyword | manual-direct
  // 키워드 → 질문 추천용 입력 값
  const [topicKeyword, setTopicKeyword] = useState("");
  const [topicMode, setTopicMode] = useState("ai");

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

  // localStorage에 저장
  function writeRefreshStateRaw(state) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(REFRESH_KEY, JSON.stringify(state));
  }

  // 현재 시점 기준으로 "사용 횟수 / 남은 횟수" 계산
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

  // 새로고침 1회 소비 (성공적으로 토픽을 새로 받았을 때만 호출)
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

  // 새 토픽 생성 요청 (AI + 제한 체크)
    async function handleGenerateTopic() {
      if (generatingTopic) return;
      if (typeof window === "undefined") return;

      const isFirstGeneration = !topic || !topic.trim(); // topic이 비어있으면 "첫 생성"

      // 첫 생성이 아니라면 → 새로고침 기회 체크
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
    // 1) 에세이 내용이 비어 있으면 막기
    if (!essay.trim()) {
      alert("에세이를 먼저 작성해 주세요.");
      return;
    }

    if (wordCount < recommendedMin) {
      const ok = confirm(
        `현재 단어 수는 ${wordCount} words 입니다.\n추천 최소 단어 수(${recommendedMin})보다 적어요.\n그래도 저장할까요?`
      );
      if (!ok) return;
    }

    // 2) topic도 없는 경우 방어 (이건 선택이지만, 있으면 더 안전)
    if (!topic.trim()) {
      const ok = confirm(
        "주제가 비어 있습니다. 이 상태로 저장할까요?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          content: essay,
          // targets: targets || [],    // 👉 target 단어 state가 있으면 여기에 넣어주면 됩니다.
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("save error:", data);
        setError(data.error || "에세이 저장 중 오류가 발생했습니다.");
        return;
      }

      // data 안에 { id, topic, difficulty, content, ... } 가 들어 있음

      alert("에세이가 저장되었습니다. 이제 AI 첨삭 페이지로 이동합니다.");

      // 방금 저장한 에세이를 Studying에서 자동 선택하도록 쿼리로 전달
      router.push(`/studying?essayId=${data.id}`);
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }


  const resetInfoText =
    refreshInfo.resetAt && refreshInfo.remaining < MAX_REFRESH
      ? ` (리셋: ${new Date(refreshInfo.resetAt).toLocaleTimeString()})`
      : "";

    // 단어 수 / 글자 수 계산
  const wordCount = useMemo(() => {
    if (!essay || !essay.trim()) return 0;
    // 줄바꿈/공백 여러 개를 하나로 보고 단어 수 세기
    return essay
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [essay]);

  const charCount = essay ? essay.length : 0;

  // 난이도별 추천 단어 수 범위
  function getRecommendedRange(diff) {
      switch (diff) {
        case "B1":
          return { min: 80, max: 120, label: "추천: 80~120 words (B1)" };
        case "B2":
          return { min: 120, max: 180, label: "추천: 120~180 words (B2)" };
        case "C1":
          return { min: 180, max: 250, label: "추천: 180~250 words (C1)" };
        default:
          return { min: 80, max: 150, label: "추천: 80~150 words" };
      }
    }

    const { min: recommendedMin, max: recommendedMax, label: recommendedLabel } =
      getRecommendedRange(difficulty);

    const isTooShort = wordCount > 0 && wordCount < recommendedMin;

    async function handleGenerateTopicFromKeyword() {
    if (!topicKeyword.trim()) {
      alert("먼저 키워드를 입력해 주세요.");
      return;
    }

    try {
      // 로딩 상태 있으면 여기에 setGeneratingTopic(true) 같은 거 써도 됨
      const res = await fetch("/api/topic-from-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: topicKeyword,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("topic-from-keyword error:", data);
        alert(data.error || "질문 추천 중 오류가 발생했습니다.");
        return;
      }

      // AI가 만들어준 질문 문장을 topic에 반영
      setTopic(data.topic || "");
    } catch (e) {
      console.error(e);
      alert("네트워크 오류가 발생했습니다.");
    }
  }


  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600 }}>Writing</h1>

      <section style={{ marginTop: "1.5rem" }}>
        {/* 첫 줄: 난이도 선택 + 모드 토글 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* 난이도 선택 */}
          <DifficultySelect value={difficulty} onChange={setDifficulty} />

          {/* 질문 설정 방식 토글: AI 자동 / 직접 설정 */}
          <div style={{ display: "flex", gap: "0.25rem", fontSize: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setTopicMode("ai")}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: topicMode === "ai" ? "#000" : "#ccc",
                backgroundColor: topicMode === "ai" ? "#000" : "#fff",
                color: topicMode === "ai" ? "#fff" : "#333",
                cursor: "pointer",
              }}
            >
              AI 자동 생성
            </button>
            <button
              type="button"
              onClick={() => setTopicMode("manual")}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: topicMode === "manual" ? "#000" : "#ccc",
                backgroundColor: topicMode === "manual" ? "#000" : "#fff",
                color: topicMode === "manual" ? "#fff" : "#333",
                cursor: "pointer",
              }}
            >
              직접 설정
            </button>
          </div>
        </div>

        {/* ① AI 자동 생성 모드 */}
        {topicMode === "ai" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleGenerateTopic}
                disabled={generatingTopic}
                style={{
                  marginRight: "0.5rem",
                  padding: "0.3rem 0.7rem",
                  cursor: generatingTopic ? "default" : "pointer",
                }}
              >
                {generatingTopic ? "토픽 생성 중..." : "AI로 주제 생성"}
              </button>
              <span
                style={{
                  marginLeft: "0.25rem",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                남은 새로고침: {refreshInfo.remaining} / {MAX_REFRESH}
                {resetInfoText}
              </span>
            </div>

            {/* AI가 만든 질문을 확인/수정할 수 있는 textarea */}
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="AI가 생성한 에세이 질문이 여기에 표시됩니다. 필요하면 직접 수정해도 좋아요."
              style={{
                marginTop: "0.5rem",
                width: "100%",
                minHeight: "80px",
                resize: "vertical",
                padding: "0.5rem 0.75rem",
                fontSize: "0.9rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* ② 직접 설정 모드 */}
        {topicMode === "manual" && (
          <div style={{ marginTop: "0.5rem" }}>
            {/* 2-1. 키워드 → 질문 추천 */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{ fontSize: "0.8rem", color: "#444", marginBottom: "0.25rem" }}
              >
                키워드로 질문 추천 받기
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  marginBottom: "0.25rem",
                }}
              >
                <input
                  type="text"
                  value={topicKeyword}
                  onChange={(e) => setTopicKeyword(e.target.value)}
                  placeholder="예: smartphone, social media, friendship..."
                  style={{
                    flex: 1,
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.8rem",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerateTopicFromKeyword}
                  style={{
                    padding: "0.35rem 0.7rem",
                    borderRadius: "4px",
                    border: "1px solid #000",
                    backgroundColor: "#000",
                    color: "#fff",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  질문 추천
                </button>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#777" }}>
                간단한 영어/한글 키워드를 적으면, 그에 맞는 에세이 질문 문장을 추천해 줄게요.
              </div>
            </div>

            {/* 2-2. 질문 문장 직접 입력 */}
            <div>
              <div
                style={{ fontSize: "0.8rem", color: "#444", marginBottom: "0.25rem" }}
              >
                질문 문장 직접 입력
              </div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: Do you think smartphones make people less social?"
                style={{
                  width: "100%",
                  minHeight: "80px",
                  resize: "vertical",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}
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

      <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
        <div>
          <span>단어 수: {wordCount}</span>
          <span className="ml-3">글자 수: {charCount}</span>
        </div>
        <div className="text-right">
          <span>{recommendedLabel}</span>
          {isTooShort && (
            <p className="text-[11px] text-orange-600 mt-0.5">
              조금만 더 써볼까요? 추천 최소 단어 수보다 적어요.
            </p>
          )}
        </div>
      </div>

      <HintBox difficulty={difficulty} />

      <button
        onClick={handleSaveEssay}
        disabled={saving || !essay.trim()}
        className="bg-black text-white px-4 py-2 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {saving ? "저장 중..." : "에세이 저장"}
      </button>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
    </main>
  );
}
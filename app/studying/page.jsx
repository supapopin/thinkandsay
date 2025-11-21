"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function StudyingPage() {
  const [essays, setEssays] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [versions, setVersions] = useState([]); // topic 기준 버전 목록
  const [selectedVersion, setSelectedVersion] = useState(null); // 상세 보기용
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingEssays, setLoadingEssays] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [error, setError] = useState(null);
  const [originalEssay, setOriginalEssay] = useState("");
  const [showOriginalInCard, setShowOriginalInCard] = useState(false);
  const [selectedVersionDisplayNumber, setSelectedVersionDisplayNumber] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const initialEssayIdFromUrl = searchParams.get("essayId");

  // 🔹 topic별 대표 정보 (드롭다운용)
  const topicOptions = useMemo(() => {
    const map = new Map();
    for (const e of essays) {
      if (!map.has(e.topic)) {
        map.set(e.topic, {
          topic: e.topic,
          difficulty: e.difficulty,
        });
      }
    }
    return Array.from(map.values());
  }, [essays]);

  // 🔹 선택된 topic에 대한 "가장 최신 에세이" 찾기 (AI 첨삭용)
  const latestEssayForSelectedTopic = useMemo(() => {
    if (!selectedTopic) return null;
    const list = essays.filter((e) => e.topic === selectedTopic);
    if (list.length === 0) return null;
    return list.reduce((latest, e) => {
      const t = new Date(e.created_at).getTime();
      const lt = latest ? new Date(latest.created_at).getTime() : 0;
      return t > lt ? e : latest;
    }, null);
  }, [essays, selectedTopic]);

  const highlightedRevised = useMemo(() => {
    if (!feedback || !feedback.revised) return "";
    return highlightRevisedText(feedback.revised, feedback.changes);
  }, [feedback]);

  const highlightedOriginal = useMemo(() => {
    if (!originalEssay) return escapeHtml(originalEssay || "");
    return highlightOriginalText(originalEssay, feedback?.changes);
  }, [originalEssay, feedback]);

    const overallScore = feedback?.score?.overall ?? null;

  const detailScores = useMemo(() => {
    if (!feedback || !feedback.score) return [];
    return Object.entries(feedback.score).filter(
      ([key]) => key !== "overall"
    );
  }, [feedback]);

  const selectedVersionLabel =
    selectedVersion
      ? selectedVersionDisplayNumber != null
        ? `선택한 버전의 첨삭 결과 (버전 #${selectedVersionDisplayNumber})`
        : "선택한 버전의 첨삭 결과"
      : "이번 첨삭 결과";

    const currentEssaySummary = useMemo(() => {
    if (!feedback) return "";

    // 버전을 선택해서 보고 있는 경우
    if (selectedVersion && selectedVersion.essay?.created_at) {
      const d = new Date(selectedVersion.essay.created_at);
      const dateStr = d.toLocaleDateString("ko-KR");
      const versionText =
        selectedVersionDisplayNumber != null
          ? `${selectedVersionDisplayNumber}번째 첨삭 버전`
          : "저장된 첨삭 버전";

      return `${dateStr} 작성 에세이 · ${versionText}`;
    }

    // 버전을 따로 선택하지 않고, 최신 에세이에 대해 방금 첨삭한 경우
    if (latestEssayForSelectedTopic?.created_at) {
      const d = new Date(latestEssayForSelectedTopic.created_at);
      const dateStr = d.toLocaleDateString("ko-KR");
      return `${dateStr} 작성 최신 에세이 첨삭 결과`;
    }

    return "";
  }, [
    feedback,
    selectedVersion,
    selectedVersionDisplayNumber,
    latestEssayForSelectedTopic,
  ]);


  // 🔹 에세이 목록 로딩
  useEffect(() => {
    async function loadEssays() {
      try {
        setLoadingEssays(true);
        const res = await fetch("/api/essays");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "에세이 목록을 불러오는 중 오류가 발생했습니다.");
          setEssays([]);
          return;
        }
        if (!Array.isArray(data)) {
          setError("에세이 목록 응답 형식이 올바르지 않습니다.");
          setEssays([]);
          return;
        }

        setEssays(data);

        if (data.length === 0) {
          setSelectedTopic("");
          setVersions([]);
          return;
        }

        // URL에 essayId가 있으면 → 그 에세이의 topic으로 선택
        let initialTopic = "";
        if (initialEssayIdFromUrl) {
          const found = data.find((e) => e.id === initialEssayIdFromUrl);
          if (found) {
            initialTopic = found.topic;
          }
        }
        if (!initialTopic) {
          initialTopic = data[0].topic;
        }

        setSelectedTopic(initialTopic);
        await loadTopicVersions(initialTopic);
      } catch (e) {
        console.error(e);
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoadingEssays(false);
      }
    }

    async function loadTopicVersions(topic) {
      if (!topic) {
        setVersions([]);
        return;
      }
      try {
        setLoadingVersions(true);
        const res = await fetch(
          `/api/topic-versions?topic=${encodeURIComponent(topic)}`
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setVersions(data);
        } else {
          setVersions([]);
        }
      } catch (e) {
        console.error(e);
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    }

    loadEssays();
  }, [initialEssayIdFromUrl]);

  // 🔹 선택된 topic 변경 시 버전 다시 로딩
  async function handleChangeTopic(e) {
    const topic = e.target.value;
    setSelectedTopic(topic);
    setFeedback(null);
    setSelectedVersion(null);
    if (!topic) {
      setVersions([]);
      return;
    }
    try {
      setLoadingVersions(true);
      const res = await fetch(
        `/api/topic-versions?topic=${encodeURIComponent(topic)}`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setVersions(data);
      } else {
        setVersions([]);
      }
    } catch (err) {
      console.error(err);
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  }

  // 🔹 AI 첨삭 요청 (선택된 topic의 가장 최신 에세이에 대해)
  async function handleFeedback() {
    setSelectedVersion(null);
    setSelectedVersionDisplayNumber(null);
    setShowOriginalInCard(false); 

    if (!selectedTopic) {
      alert("먼저 질문(Topic)을 선택해 주세요.");
      return;
    }

    const targetEssay = latestEssayForSelectedTopic;
    if (!targetEssay) {
      alert("선택한 질문에 해당하는 에세이가 없습니다.");
      return;
    }

    setOriginalEssay(targetEssay.content || "");

    setLoadingFeedback(true);
    setFeedback(null);
    setSelectedVersion(null);
    setError(null);

    try {
      const res = await fetch(`/api/essays/${targetEssay.id}/feedback`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("feedback error:", data);
        setError(data.error || "AI 첨삭 중 오류가 발생했습니다.");
        return;
      }

      setFeedback(data.feedback);
      await refreshTopicVersions(selectedTopic);
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoadingFeedback(false);
    }
  }

  // 🔹 선택된 topic에 대한 버전 새로 불러오기
  async function refreshTopicVersions(topic) {
    if (!topic) return;
    try {
      const res = await fetch(
        `/api/topic-versions?topic=${encodeURIComponent(topic)}`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setVersions(data);
      } else {
        setVersions([]);
      }
    } catch (e) {
      console.error(e);
      setVersions([]);
    }
  }

  // 🔹 버전 카드 클릭 → 해당 버전의 첨삭 내용 보기
  function handleSelectVersion(v, displayNumber) {
    if (!v || !v.ai_feedback) return;
    setSelectedVersion(v);
    setSelectedVersionDisplayNumber(displayNumber); 
    setFeedback(v.ai_feedback);

    if (v.essay?.content) {
      setOriginalEssay(v.essay.content);
    } else {
      setOriginalEssay("");
    }
    setShowOriginalInCard(false);
  }

  // 🔹 되돌아가기 (현재 선택된 버전 해제)
  function handleBackToVersionList() {
    setSelectedVersion(null);
    setSelectedVersionDisplayNumber(null);
    setFeedback(null);
    setOriginalEssay("");
    setShowOriginalInCard(false);
  }

  // 🔹 이 질문으로 새 에세이 쓰기
  function handleWriteNewEssayForTopic() {
    if (!selectedTopic) return;
    const essaysForTopic = essays.filter((e) => e.topic === selectedTopic);
    const base = essaysForTopic[0] || latestEssayForSelectedTopic;
    const q = new URLSearchParams();
    q.set("topic", selectedTopic);
    if (base?.difficulty) q.set("difficulty", base.difficulty);
    router.push(`/writing?${q.toString()}`);
  }

  function escapeHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeRegExp(str) {
    return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightRevisedText(revised, changes) {
    let html = escapeHtml(revised || "");

    if (!changes || !Array.isArray(changes)) return html;

    for (const c of changes) {
      if (!c || !c.to) continue;

      const target = escapeHtml(c.to);
      if (!target) continue;

      // 너무 긴 변경은 하이라이트하지 않음 (문장 전체 방지)
      const wordCount = target.split(/\s+/).length;
      if (target.length > 60 || wordCount > 6) continue;

      const pattern = escapeRegExp(target);
      const re = new RegExp(pattern, "g");

      html = html.replace(
        re,
        `<mark class="bg-green-200">${target}</mark>`
      );
    }

    return html;
  }


  function highlightOriginalText(original, changes) {
    let html = escapeHtml(original || "");

    if (!changes || !Array.isArray(changes)) return html;

    for (const c of changes) {
      if (!c || !c.from) continue;

      const target = escapeHtml(c.from);
      if (!target) continue;

      const wordCount = target.split(/\s+/).length;
      if (target.length > 60 || wordCount > 6) continue;

      const pattern = escapeRegExp(target);
      const re = new RegExp(pattern, "g");

      html = html.replace(
        re,
        `<mark class="bg-yellow-200">${target}</mark>`
      );
    }

    return html;
  }


  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI 첨삭 & 버전 관리</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* 질문(Topic) 선택 드롭다운 */}
      <section className="space-y-2">
        <div className="text-sm font-medium">질문(Topic) 선택</div>
        {loadingEssays ? (
          <p className="text-gray-500 text-sm">에세이 목록 불러오는 중...</p>
        ) : topicOptions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            아직 저장된 에세이가 없습니다. 먼저 Writing에서 에세이를 저장해 주세요.
          </p>
        ) : (
          <select
            value={selectedTopic}
            onChange={handleChangeTopic}
            className="border rounded px-3 py-2 text-sm w-full"
          >
            {topicOptions.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic} ({t.difficulty || "N/A"})
              </option>
            ))}
          </select>
        )}
      </section>

      {/* 액션 버튼 영역 */}
      <section className="flex gap-3 items-center flex-wrap">
        <button
          onClick={handleFeedback}
          disabled={loadingFeedback || !selectedTopic}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:bg-gray-500"
        >
          {loadingFeedback ? "AI 첨삭 중..." : "선택한 질문의 최신 에세이 AI 첨삭"}
        </button>

        <button
          onClick={handleWriteNewEssayForTopic}
          disabled={!selectedTopic}
          className="border border-gray-400 text-gray-800 px-4 py-2 rounded text-sm disabled:border-gray-300 disabled:text-gray-400"
        >
          이 질문으로 새 에세이 쓰기
        </button>
      </section>

      {/* 최신 또는 선택된 버전의 첨삭 결과 */}
        {feedback && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{selectedVersionLabel}</h2>
            {selectedVersion && (
              <button
                onClick={handleBackToVersionList}
                className="text-sm text-blue-600 underline"
              >
                ← 버전 목록으로 돌아가기
              </button>
            )}
          </div>

          {currentEssaySummary && (
            <p className="text-xs text-gray-500">
              {currentEssaySummary}
            </p>
          )}


          <div className="p-4 border rounded bg-gray-50 whitespace-pre-line">
            <div className="flex items-center justify-between">
              <strong>
                {showOriginalInCard ? "Original Essay" : "Revised Essay"}
              </strong>
              <button
                type="button"
                onClick={() => setShowOriginalInCard((prev) => !prev)}
                className="text-xs text-blue-600 underline"
              >
                {showOriginalInCard ? "Revised 보기" : "Original 보기"}
              </button>
            </div>

            <div className="mt-2">
              {showOriginalInCard ? (
                // ✅ Original + 노란 하이라이트
                <div
                  dangerouslySetInnerHTML={{ __html: highlightedOriginal }}
                />
              ) : (
                // ✅ Revised + 초록 하이라이트
                <div
                  dangerouslySetInnerHTML={{ __html: highlightedRevised }}
                />
              )}
            </div>
          </div>

          <div className="p-4 border rounded space-y-2">
            <div className="flex items-baseline justify-between">
              <strong>Scores</strong>
              {overallScore != null && (
                <span className="text-xs text-gray-500">
                  overall (0–100)
                </span>
              )}
            </div>

            {overallScore != null && (
              <div className="text-2xl font-semibold">
                {overallScore}
                <span className="text-sm text-gray-500 ml-1">/ 100</span>
              </div>
            )}

            {detailScores.length > 0 && (
              <ul className="text-sm mt-1 space-y-1">
                {detailScores.map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="capitalize">{k}</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 border rounded">
            <strong>Changes</strong>
            <ul className="text-sm mt-2 list-disc pl-5">
              {(feedback.changes || []).map((c, i) => (
                <li key={i}>
                  <b>{c.from}</b> → <i>{c.to}</i> ({c.reason})
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border rounded bg-white whitespace-pre-line">
            <strong>Original Essay</strong>
            <div
              className="mt-2"
              dangerouslySetInnerHTML={{ __html: highlightedOriginal }}
            />
          </div>
        </section>
      )}

      {/* 저장된 첨삭 버전 리스트 (같은 질문으로 된 모든 답변들) */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">저장된 첨삭 버전들</h2>
        {loadingVersions ? (
          <p className="text-gray-500 text-sm">버전 목록 불러오는 중...</p>
        ) : versions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            아직 이 질문에 대한 첨삭 버전이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {versions.map((v, idx) => {
              const displayNumber = versions.length - idx; // 오래된 = 1, 최신 = n
              const isActive = selectedVersion && selectedVersion.id === v.id; // ✅ 현재 보고 있는 버전인지

              return (
                <li key={v.id}>
                  <button
                    onClick={() => handleSelectVersion(v, displayNumber)}
                    className={[
                      "w-full text-left border rounded p-3 hover:bg-gray-50",
                      isActive ? "bg-gray-100 border-gray-400" : "bg-white border-gray-200",
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-center">
                      <span>
                        버전 #{displayNumber}
                        {v.essay && (
                          <span className="ml-2 text-xs text-gray-500">
                            (시도: {new Date(v.essay.created_at).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                    {v.ai_feedback?.score?.overall != null && (
                      <div className="mt-1 text-xs text-gray-600">
                        overall: {v.ai_feedback.score.overall}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

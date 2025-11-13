"use client";

import { useState } from "react";

export default function HintBox({ difficulty }) {
  const [koreanHint, setKoreanHint] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGetHint() {
    if (!koreanHint.trim()) {
      alert("어떤 내용을 쓰고 싶은지 한글로 적어주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setKeywords([]);

    try {
      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: koreanHint,
          difficulty: difficulty || "B1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("hint error:", data);
        setError(data.error || "힌트를 불러오는 중 오류가 발생했습니다.");
        return;
      }

      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        marginTop: "1.5rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        background: "#fafafa",
      }}
    >
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        힌트 (한글 → 영어 키워드)
      </h2>
      <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.75rem" }}>
        한글로 “이런 내용 쓰고 싶다”를 적으면, 문장 전체가 아니라 영어 키워드/표현만 보여줄게.
      </p>

      <textarea
        value={koreanHint}
        onChange={(e) => setKoreanHint(e.target.value)}
        placeholder="예: 친구와 보내는 여가시간에 대해 쓰고 싶어"
        style={{
          width: "100%",
          minHeight: "60px",
          padding: "0.5rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "0.9rem",
          resize: "vertical",
        }}
      />

      <button
        onClick={handleGetHint}
        disabled={loading}
        style={{
          marginTop: "0.5rem",
          padding: "0.4rem 0.8rem",
          borderRadius: "6px",
          border: "none",
          background: loading ? "#777" : "#111",
          color: "white",
          fontSize: "0.85rem",
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "영어 키워드 힌트 생성 중..." : "영어 키워드 힌트 보기"}
      </button>

      {error && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#d00" }}>{error}</p>
      )}

      {keywords.length > 0 && (
        <div
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.5rem",
            borderTop: "1px dashed #ddd",
          }}
        >
          <p style={{ fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            영어 키워드/표현:
          </p>
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {keywords.map((kw, i) => (
              <li
                key={i}
                style={{
                  fontSize: "0.8rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  border: "1px solid #ccc",
                  background: "white",
                }}
              >
                {kw}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}